from __future__ import annotations

from typing import Any

from workers.delete_worker import DeleteWorker
from workers.ingestion_worker import IngestionWorker
from workers.retry_policy import calculate_retry_backoff_seconds, evaluate_retry_transition


class FakeCursor:
    def __init__(self, connection: "FakeConnection") -> None:
        self.connection = connection
        self._fetchone_row = None
        self.rowcount = 1

    def execute(self, sql: str, params=None) -> None:
        normalized = " ".join(sql.split())
        self.connection.executed.append((normalized, params))
        self.rowcount = self.connection.resolve_rowcount(normalized)

        if "FROM jobs" in normalized and "FOR UPDATE" in normalized:
            self._fetchone_row = self.connection.next_job()

    def fetchone(self):
        row = self._fetchone_row
        self._fetchone_row = None
        return row

    def close(self) -> None:
        return None


class FakeConnection:
    def __init__(self, jobs=None, rowcount_overrides=None) -> None:
        self.jobs = list(jobs or [])
        self.executed: list[tuple[str, Any]] = []
        self.commits = 0
        self.rollbacks = 0
        self.tx_begins = 0
        self.rowcount_overrides = dict(rowcount_overrides or {})

    def cursor(self):
        return FakeCursor(self)

    def start_transaction(self) -> None:
        self.tx_begins += 1

    def commit(self) -> None:
        self.commits += 1

    def rollback(self) -> None:
        self.rollbacks += 1

    def next_job(self):
        if not self.jobs:
            return None
        return self.jobs.pop(0)

    def resolve_rowcount(self, normalized_sql: str) -> int:
        for marker, value in self.rowcount_overrides.items():
            if marker in normalized_sql:
                return value
        return 1


def test_retry_backoff_progression_is_deterministic():
    assert calculate_retry_backoff_seconds(1) == 30
    assert calculate_retry_backoff_seconds(2) == 120
    assert calculate_retry_backoff_seconds(3) == 300
    assert calculate_retry_backoff_seconds(10) == 1800


def test_transition_enforces_dead_letter_at_max_retry():
    decision = evaluate_retry_transition(current_retry=2, max_retries=3)

    assert decision.next_status == "dead_letter"
    assert decision.next_retry_count == 3
    assert decision.backoff_seconds is None


def test_ingestion_worker_requeue_sets_pending_status_before_max_retry():
    conn = FakeConnection(
        jobs=[
            {
                "id": 500,
                "type": "INGEST",
                "payload": {"document_id": 1234},
                "retry_count": 1,
                "max_retries": 5,
            }
        ]
    )
    worker = IngestionWorker(conn)

    def crash(*args, **kwargs):
        raise RuntimeError("embed timeout")

    worker.embed_chunks = crash

    processed = worker.run_once()

    assert processed is True
    assert any("UPDATE jobs SET status = 'pending'" in sql for sql, _ in conn.executed)


def test_delete_worker_dead_letter_inserts_payload_snapshot():
    conn = FakeConnection(
        jobs=[
            {
                "id": 700,
                "type": "DELETE_DOC",
                "payload": {"document_id": 8080},
                "retry_count": 2,
                "max_retries": 3,
            }
        ]
    )
    worker = DeleteWorker(conn)

    def crash(*args, **kwargs):
        raise RuntimeError("document delete failed")

    worker.mark_document_deleted = crash

    processed = worker.run_once()

    assert processed is True
    dlq_entries = [
        (sql, params)
        for sql, params in conn.executed
        if "INSERT INTO dead_letter_jobs" in sql
    ]
    assert len(dlq_entries) == 1
    dlq_params = dlq_entries[0][1]
    assert dlq_params[0] == 700
    assert dlq_params[1] == "DELETE_DOC"
    assert "document delete failed" in dlq_params[3]


def test_ingestion_worker_skips_when_processing_claim_is_not_acquired():
    conn = FakeConnection(
        jobs=[
            {
                "id": 900,
                "type": "INGEST",
                "payload": {"document_id": 2222},
                "retry_count": 0,
                "max_retries": 3,
            }
        ],
        rowcount_overrides={"UPDATE jobs SET status = 'processing'": 0},
    )
    worker = IngestionWorker(conn)

    processed = worker.run_once()

    assert processed is False
    sql_log = [sql for sql, _ in conn.executed]
    assert not any("INSERT INTO job_steps" in sql for sql in sql_log)
