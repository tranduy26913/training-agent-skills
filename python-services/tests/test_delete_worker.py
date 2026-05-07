from __future__ import annotations

from workers.delete_worker import DeleteWorker


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


def test_run_once_delete_happy_path_removes_vectors_chunks_and_marks_document_deleted():
    conn = FakeConnection(
        jobs=[
            {
                "id": 90,
                "type": "DELETE_DOC",
                "payload": {"document_id": 1001},
                "retry_count": 0,
                "max_retries": 3,
            }
        ]
    )
    worker = DeleteWorker(conn)

    processed = worker.run_once()

    assert processed is True
    assert conn.commits == 1
    sql_log = [entry[0] for entry in conn.executed]
    assert any("UPDATE chunks SET vector_id = NULL" in sql for sql in sql_log)
    assert any("DELETE FROM chunks" in sql for sql in sql_log)
    assert any("UPDATE documents" in sql and "status = 'deleted'" in sql and "file_data = NULL" in sql for sql in sql_log)
    assert any("UPDATE jobs SET status = 'done'" in sql for sql in sql_log)


def test_run_once_delete_failure_requeues_before_max_retry():
    conn = FakeConnection(
        jobs=[
            {
                "id": 91,
                "type": "DELETE_DOC",
                "payload": {"document_id": 1002},
                "retry_count": 1,
                "max_retries": 4,
            }
        ]
    )
    worker = DeleteWorker(conn)

    def crash(*args, **kwargs):
        raise RuntimeError("vector store offline")

    worker.delete_chunk_vectors = crash

    processed = worker.run_once()

    assert processed is True
    sql_log = [entry[0] for entry in conn.executed]
    assert any("retry_count = retry_count + 1" in sql for sql in sql_log)
    assert any("UPDATE jobs SET status = 'pending'" in sql for sql in sql_log)


def test_run_once_delete_failure_moves_to_dead_letter_at_max_retry():
    conn = FakeConnection(
        jobs=[
            {
                "id": 92,
                "type": "DELETE_DOC",
                "payload": {"document_id": 1003},
                "retry_count": 2,
                "max_retries": 3,
            }
        ]
    )
    worker = DeleteWorker(conn)

    def crash(*args, **kwargs):
        raise RuntimeError("chunk delete failed")

    worker.delete_chunks = crash

    processed = worker.run_once()

    assert processed is True
    sql_log = [entry[0] for entry in conn.executed]
    assert any("status = 'dead_letter'" in sql for sql in sql_log)
    assert any("UPDATE jobs SET status = 'dead_letter'" in sql for sql in sql_log)
