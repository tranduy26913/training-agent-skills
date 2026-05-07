from __future__ import annotations

import pytest

from workers.ingestion_worker import IngestionWorker


class FakeCursor:
    def __init__(self, connection: "FakeConnection") -> None:
        self.connection = connection
        self._fetchone_row = None

    def execute(self, sql: str, params=None) -> None:
        normalized = " ".join(sql.split())
        self.connection.executed.append((normalized, params))

        if "FROM jobs" in normalized and "FOR UPDATE" in normalized:
            self._fetchone_row = self.connection.next_job()

    def fetchone(self):
        row = self._fetchone_row
        self._fetchone_row = None
        return row

    def close(self) -> None:
        return None


class FakeConnection:
    def __init__(self, jobs=None) -> None:
        self.jobs = list(jobs or [])
        self.executed = []
        self.commits = 0
        self.rollbacks = 0
        self.tx_begins = 0

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


def test_run_once_ingest_happy_path_marks_steps_and_job_complete():
    conn = FakeConnection(
        jobs=[
            {
                "id": 10,
                "type": "INGEST",
                "payload": {"document_id": 123},
                "retry_count": 0,
                "max_retries": 3,
            }
        ]
    )
    worker = IngestionWorker(conn)

    processed = worker.run_once()

    assert processed is True
    assert conn.commits == 1
    sql_log = [entry[0] for entry in conn.executed]
    entries = conn.executed
    assert any("UPDATE jobs SET status = 'processing'" in sql for sql in sql_log)
    assert any("UPDATE jobs SET status = 'done'" in sql for sql in sql_log)
    assert any(
        "ON DUPLICATE KEY UPDATE status = 'running'" in sql and params == (10, "parse")
        for sql, params in entries
    )
    assert any(
        "UPDATE job_steps SET status = 'completed'" in sql and params == (10, "index")
        for sql, params in entries
    )


def test_run_once_ingest_failure_requeues_before_max_retry():
    conn = FakeConnection(
        jobs=[
            {
                "id": 11,
                "type": "INGEST",
                "payload": {"document_id": 456},
                "retry_count": 0,
                "max_retries": 3,
            }
        ]
    )
    worker = IngestionWorker(conn)

    def crash(*args, **kwargs):
        raise RuntimeError("embedding service unavailable")

    worker.embed_chunks = crash

    processed = worker.run_once()

    assert processed is True
    sql_log = [entry[0] for entry in conn.executed]
    assert any("retry_count = retry_count + 1" in sql for sql in sql_log)
    assert any("UPDATE jobs SET status = 'pending'" in sql for sql in sql_log)


def test_run_once_ingest_failure_moves_to_dead_letter_at_max_retry():
    conn = FakeConnection(
        jobs=[
            {
                "id": 12,
                "type": "INGEST",
                "payload": {"document_id": 789},
                "retry_count": 2,
                "max_retries": 3,
            }
        ]
    )
    worker = IngestionWorker(conn)

    def crash(*args, **kwargs):
        raise RuntimeError("parse failure")

    worker.parse_document = crash

    processed = worker.run_once()

    assert processed is True
    sql_log = [entry[0] for entry in conn.executed]
    assert any("status = 'dead_letter'" in sql for sql in sql_log)
    assert any("status = 'failed'" in sql and "job_steps" in sql for sql in sql_log)
