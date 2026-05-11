from __future__ import annotations

import hashlib
import json
from typing import Any

from workers.retry_policy import apply_retry_policy


def _split_into_chunks(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split *text* into fixed-size chunks with optional character overlap."""
    if not text.strip():
        return []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = end - overlap
    return chunks

INGEST_JOB_TYPE = "INGEST"
INGESTION_STEPS = ("parse", "chunk", "embed", "index")


class IngestionWorker:
    """Queue consumer that runs document ingestion steps from MySQL-backed jobs."""

    def __init__(self, connection: Any, default_max_retries: int = 3) -> None:
        self.connection = connection
        self.default_max_retries = default_max_retries

    def run_once(self) -> bool:
        self._begin_transaction()
        try:
            job = self._claim_next_job()
            if not job:
                self.connection.commit()
                return False

            if not self._mark_job_running(job["id"]):
                self.connection.commit()
                return False
            document_id = self._extract_document_id(job.get("payload"))

            for step_name in INGESTION_STEPS:
                self._mark_step_running(job["id"], step_name)
                self._touch_heartbeat(job["id"])
                self._run_step(step_name, document_id, job)
                self._mark_step_completed(job["id"], step_name)

            self._mark_job_completed(job["id"])
            self.connection.commit()
            return True
        except Exception as error:
            if "job" in locals() and job:
                self._handle_step_failure(job, step_name if "step_name" in locals() else "parse", error)
                self.connection.commit()
                return True

            self.connection.rollback()
            raise

    def _begin_transaction(self) -> None:
        if hasattr(self.connection, "start_transaction"):
            self.connection.start_transaction()
            return

        cursor = self.connection.cursor()
        try:
            cursor.execute("START TRANSACTION")
        finally:
            cursor.close()

    def _claim_next_job(self) -> dict[str, Any] | None:
        sql = (
            "SELECT id, type, payload, retry_count, max_retries "
            "FROM jobs "
            "WHERE type = %s AND status = 'pending' "
            "ORDER BY id ASC "
            "LIMIT 1 FOR UPDATE"
        )
        cursor = self.connection.cursor()
        try:
            cursor.execute(sql, (INGEST_JOB_TYPE,))
            return cursor.fetchone()
        finally:
            cursor.close()

    def _touch_heartbeat(self, job_id: int) -> None:
        self._execute("UPDATE jobs SET updated_at = NOW() WHERE id = %s", (job_id,))

    def _mark_job_running(self, job_id: int) -> bool:
        updated_rows = self._execute(
            "UPDATE jobs SET status = 'processing', updated_at = NOW() "
            "WHERE id = %s AND status = 'pending'",
            (job_id,),
        )
        return updated_rows > 0

    def _mark_job_completed(self, job_id: int) -> None:
        self._execute(
            "UPDATE jobs SET status = 'done', updated_at = NOW() "
            "WHERE id = %s AND status = 'processing'",
            (job_id,),
        )

    def _mark_step_running(self, job_id: int, step_name: str) -> None:
        self._execute(
            "INSERT INTO job_steps (job_id, step_name, status, started_at) "
            "VALUES (%s, %s, 'running', NOW()) "
            "ON DUPLICATE KEY UPDATE status = 'running', started_at = COALESCE(started_at, NOW())",
            (job_id, step_name),
        )

    def _mark_step_completed(self, job_id: int, step_name: str) -> None:
        self._execute(
            "UPDATE job_steps SET status = 'done', finished_at = NOW() "
            "WHERE job_id = %s AND step_name = %s",
            (job_id, step_name),
        )

    def _mark_step_failed(self, job_id: int, step_name: str, error_message: str) -> None:
        self._execute(
            "UPDATE job_steps SET status = 'failed', detail = %s, finished_at = NOW() "
            "WHERE job_id = %s AND step_name = %s",
            (error_message, job_id, step_name),
        )

    def _handle_step_failure(self, job: dict[str, Any], step_name: str, error: Exception) -> None:
        error_message = str(error)
        job_id = int(job["id"])

        self._mark_step_failed(job_id, step_name, error_message)
        apply_retry_policy(
            execute=self._execute,
            job=job,
            error_message=error_message,
            failed_step=step_name,
            source_worker=self.__class__.__name__,
            default_max_retries=self.default_max_retries,
        )

    def _run_step(self, step_name: str, document_id: int, job: dict[str, Any]) -> None:
        if step_name == "parse":
            self.parse_document(document_id, job)
            return
        if step_name == "chunk":
            self.chunk_document(document_id, job)
            return
        if step_name == "embed":
            self.embed_chunks(document_id, job)
            return
        self.index_chunks(document_id, job)

    def parse_document(self, document_id: int, job: dict[str, Any]) -> None:
        row = self._fetch_one(
            "SELECT id, status FROM documents WHERE id = %s",
            (document_id,),
        )
        if not row:
            raise ValueError(f"Document {document_id} not found")
        if row["status"] == "deleted":
            raise ValueError(f"Document {document_id} is already deleted")
        self._execute(
            "UPDATE documents SET status = 'processing', updated_at = NOW() WHERE id = %s",
            (document_id,),
        )

    def chunk_document(self, document_id: int, job: dict[str, Any]) -> None:
        row = self._fetch_one(
            "SELECT file_data, workspace_id FROM documents WHERE id = %s",
            (document_id,),
        )
        if not row:
            raise ValueError(f"Document {document_id} not found")
        raw_data = row["file_data"]
        if isinstance(raw_data, (bytes, bytearray)):
            try:
                text = raw_data.decode("utf-8")
            except UnicodeDecodeError:
                text = raw_data.decode("latin-1")
        else:
            text = str(raw_data)
        workspace_id = int(row["workspace_id"])
        chunks = _split_into_chunks(text)
        self._execute("DELETE FROM chunks WHERE document_id = %s", (document_id,))
        for chunk_index, chunk_text in enumerate(chunks):
            self._execute(
                "INSERT INTO chunks (document_id, workspace_id, chunk_index, chunk_text) "
                "VALUES (%s, %s, %s, %s)",
                (document_id, workspace_id, chunk_index, chunk_text),
            )

    def embed_chunks(self, document_id: int, job: dict[str, Any]) -> None:
        rows = self._fetch_all(
            "SELECT id, chunk_index FROM chunks WHERE document_id = %s AND vector_id IS NULL",
            (document_id,),
        )
        for row in rows:
            raw = f"doc_{document_id}_chunk_{row['chunk_index']}"
            vector_id = hashlib.sha256(raw.encode()).hexdigest()[:32]
            self._execute(
                "UPDATE chunks SET vector_id = %s WHERE id = %s",
                (vector_id, row["id"]),
            )

    def index_chunks(self, document_id: int, job: dict[str, Any]) -> None:
        self._execute(
            "UPDATE documents SET status = 'indexed', updated_at = NOW() WHERE id = %s",
            (document_id,),
        )

    def _extract_document_id(self, payload_json: Any) -> int:
        if isinstance(payload_json, str):
            payload_json = json.loads(payload_json)
        if not isinstance(payload_json, dict):
            raise ValueError("Job payload must include document_id")

        raw_document_id = payload_json.get("document_id", payload_json.get("documentId"))
        if raw_document_id is None:
            raise ValueError("Job payload must include document_id")

        return int(raw_document_id)

    def _execute(self, sql: str, params: tuple[Any, ...]) -> int:
        cursor = self.connection.cursor()
        try:
            cursor.execute(sql, params)
            return int(getattr(cursor, "rowcount", 1) or 0)
        finally:
            cursor.close()

    def _fetch_one(self, sql: str, params: tuple[Any, ...]) -> dict[str, Any] | None:
        cursor = self.connection.cursor()
        try:
            cursor.execute(sql, params)
            return cursor.fetchone()
        finally:
            cursor.close()

    def _fetch_all(self, sql: str, params: tuple[Any, ...]) -> list[dict[str, Any]]:
        cursor = self.connection.cursor()
        try:
            cursor.execute(sql, params)
            return cursor.fetchall()
        finally:
            cursor.close()
