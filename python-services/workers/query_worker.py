from __future__ import annotations

import json
from typing import Any

from workers.retry_policy import apply_retry_policy

QUERY_JOB_TYPE = "QUERY"
QUERY_STEPS = ("prepare", "retrieve", "synthesize", "store")


class QueryWorker:
    """Queue consumer that runs query workflow steps for NotebookLM operations."""

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

            query_payload = self._extract_payload(job.get("payload"))

            for step_name in QUERY_STEPS:
                self._mark_step_running(job["id"], step_name)
                self._touch_heartbeat(job["id"])
                self._run_step(step_name, query_payload, job)
                self._mark_step_completed(job["id"], step_name)

            self._mark_job_completed(job["id"])
            self.connection.commit()
            return True
        except Exception as error:
            if "job" in locals() and job:
                self._handle_step_failure(job, step_name if "step_name" in locals() else "prepare", error)
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
            cursor.execute(sql, (QUERY_JOB_TYPE,))
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
        self._mark_step_failed(int(job["id"]), step_name, error_message)
        apply_retry_policy(
            execute=self._execute,
            job=job,
            error_message=error_message,
            failed_step=step_name,
            source_worker=self.__class__.__name__,
            default_max_retries=self.default_max_retries,
        )

    def _run_step(self, step_name: str, payload: dict[str, Any], job: dict[str, Any]) -> None:
        if step_name == "prepare":
            self.prepare_query(payload, job)
            return
        if step_name == "retrieve":
            self.retrieve_context(payload, job)
            return
        if step_name == "synthesize":
            self.synthesize_answer(payload, job)
            return
        self.store_result(payload, job)

    def prepare_query(self, payload: dict[str, Any], job: dict[str, Any]) -> None:
        """Hook for prepare step implementation."""

    def retrieve_context(self, payload: dict[str, Any], job: dict[str, Any]) -> None:
        """Hook for retrieval step implementation."""

    def synthesize_answer(self, payload: dict[str, Any], job: dict[str, Any]) -> None:
        """Hook for synthesis step implementation."""

    def store_result(self, payload: dict[str, Any], job: dict[str, Any]) -> None:
        """Hook for final persistence step implementation."""

    def _extract_payload(self, payload_json: Any) -> dict[str, Any]:
        if isinstance(payload_json, str):
            payload_json = json.loads(payload_json)
        if not isinstance(payload_json, dict):
            raise ValueError("Job payload must be an object")
        return payload_json

    def _execute(self, sql: str, params: tuple[Any, ...]) -> int:
        cursor = self.connection.cursor()
        try:
            cursor.execute(sql, params)
            return int(getattr(cursor, "rowcount", 1) or 0)
        finally:
            cursor.close()
