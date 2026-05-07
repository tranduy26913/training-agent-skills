from __future__ import annotations

import json
from typing import Any

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

            self._mark_job_running(job["id"])
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

    def _mark_job_running(self, job_id: int) -> None:
        self._execute(
            "UPDATE jobs SET status = 'processing', updated_at = NOW() WHERE id = %s",
            (job_id,),
        )

    def _mark_job_completed(self, job_id: int) -> None:
        self._execute(
            "UPDATE jobs SET status = 'done', updated_at = NOW() WHERE id = %s",
            (job_id,),
        )

    def _mark_step_running(self, job_id: int, step_name: str) -> None:
        self._execute(
            "INSERT INTO job_steps (job_id, step_name, status, started_at, updated_at) "
            "VALUES (%s, %s, 'running', NOW(), NOW()) "
            "ON DUPLICATE KEY UPDATE status = 'running', started_at = COALESCE(started_at, NOW()), "
            "updated_at = NOW()",
            (job_id, step_name),
        )

    def _mark_step_completed(self, job_id: int, step_name: str) -> None:
        self._execute(
            "UPDATE job_steps SET status = 'completed', finished_at = NOW(), updated_at = NOW() "
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
        current_retry = int(job.get("retry_count") or 0)
        max_retries = int(job.get("max_retries") or self.default_max_retries)

        self._mark_step_failed(job_id, step_name, error_message)
        self._execute(
            "UPDATE jobs SET retry_count = retry_count + 1, error_message = %s, updated_at = NOW() WHERE id = %s",
            (error_message, job_id),
        )

        if current_retry + 1 >= max_retries:
            self._execute(
                "UPDATE jobs SET status = 'dead_letter', error_message = %s, updated_at = NOW() WHERE id = %s",
                (error_message, job_id),
            )
            return

        self._execute(
            "UPDATE jobs SET status = 'pending', error_message = %s, updated_at = NOW() "
            "WHERE id = %s",
            (error_message, job_id),
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
        """Hook for parse step implementation."""

    def chunk_document(self, document_id: int, job: dict[str, Any]) -> None:
        """Hook for chunk step implementation."""

    def embed_chunks(self, document_id: int, job: dict[str, Any]) -> None:
        """Hook for embed step implementation."""

    def index_chunks(self, document_id: int, job: dict[str, Any]) -> None:
        """Hook for index step implementation."""

    def _extract_document_id(self, payload_json: Any) -> int:
        if isinstance(payload_json, str):
            payload_json = json.loads(payload_json)
        if not isinstance(payload_json, dict) or "document_id" not in payload_json:
            raise ValueError("Job payload must include document_id")
        return int(payload_json["document_id"])

    def _execute(self, sql: str, params: tuple[Any, ...]) -> None:
        cursor = self.connection.cursor()
        try:
            cursor.execute(sql, params)
        finally:
            cursor.close()
