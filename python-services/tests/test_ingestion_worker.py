from __future__ import annotations

import pytest

from workers.ingestion_worker import IngestionWorker, _split_into_chunks


class FakeCursor:
    def __init__(self, connection: "FakeConnection") -> None:
        self.connection = connection
        self._fetchone_row = None
        self._fetchall_rows: list = []

    def execute(self, sql: str, params=None) -> None:
        normalized = " ".join(sql.split())
        self.connection.executed.append((normalized, params))
        self._fetchone_row = None
        self._fetchall_rows = []

        if "FROM jobs" in normalized and "FOR UPDATE" in normalized:
            self._fetchone_row = self.connection.next_job()
        elif "SELECT" in normalized and "FROM documents" in normalized:
            doc_id = params[0] if params else None
            self._fetchone_row = self.connection.get_document(doc_id)
        elif "SELECT" in normalized and "FROM chunks" in normalized:
            doc_id = params[0] if params else None
            self._fetchall_rows = self.connection.get_chunks(doc_id)

    def fetchone(self):
        row = self._fetchone_row
        self._fetchone_row = None
        return row

    def fetchall(self):
        rows = self._fetchall_rows
        self._fetchall_rows = []
        return rows

    def close(self) -> None:
        return None


class FakeConnection:
    def __init__(self, jobs=None, documents=None, chunks=None) -> None:
        self.jobs = list(jobs or [])
        self._documents = {d["id"]: d for d in (documents or [])}
        self._chunks = list(chunks or [])
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

    def get_document(self, doc_id):
        return self._documents.get(doc_id)

    def get_chunks(self, doc_id):
        return [c for c in self._chunks if c["document_id"] == doc_id]


def _make_document(doc_id: int, workspace_id: int = 1, file_data: bytes = b"Hello world") -> dict:
    return {
        "id": doc_id,
        "workspace_id": workspace_id,
        "status": "pending",
        "file_data": file_data,
    }


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
        ],
        documents=[_make_document(123)],
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
        "UPDATE job_steps SET status = 'done'" in sql and params == (10, "index")
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
        ],
        documents=[_make_document(456)],
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
        ],
        documents=[_make_document(789)],
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


def test_run_once_ingest_accepts_document_id_from_express_payload():
    conn = FakeConnection(
        jobs=[
            {
                "id": 13,
                "type": "INGEST",
                "payload": {"documentId": 321, "workspaceId": 10},
                "retry_count": 0,
                "max_retries": 3,
            }
        ],
        documents=[_make_document(321)],
    )
    worker = IngestionWorker(conn)

    processed = worker.run_once()

    assert processed is True
    sql_log = [entry[0] for entry in conn.executed]
    assert any("UPDATE jobs SET status = 'done'" in sql for sql in sql_log)


# ---------------------------------------------------------------------------
# Hook method unit tests
# ---------------------------------------------------------------------------


def test_parse_document_updates_status_to_processing():
    conn = FakeConnection(documents=[_make_document(1)])
    worker = IngestionWorker(conn)

    worker.parse_document(1, {})

    sql_log = [entry[0] for entry in conn.executed]
    assert any("UPDATE documents SET status = 'processing'" in sql for sql in sql_log)


def test_parse_document_raises_when_document_not_found():
    conn = FakeConnection()
    worker = IngestionWorker(conn)

    with pytest.raises(ValueError, match="not found"):
        worker.parse_document(99, {})


def test_parse_document_raises_when_document_deleted():
    doc = _make_document(5)
    doc["status"] = "deleted"
    conn = FakeConnection(documents=[doc])
    worker = IngestionWorker(conn)

    with pytest.raises(ValueError, match="already deleted"):
        worker.parse_document(5, {})


def test_chunk_document_deletes_old_chunks_and_inserts_new():
    conn = FakeConnection(documents=[_make_document(2, file_data=b"word " * 120)])
    worker = IngestionWorker(conn)

    worker.chunk_document(2, {})

    sql_log = [entry[0] for entry in conn.executed]
    assert any("DELETE FROM chunks WHERE document_id = %s" in sql for sql in sql_log)
    assert any("INSERT INTO chunks" in sql for sql in sql_log)


def test_chunk_document_handles_non_utf8_bytes():
    raw = bytes(range(200))  # Not valid UTF-8
    conn = FakeConnection(documents=[_make_document(3, file_data=raw)])
    worker = IngestionWorker(conn)

    worker.chunk_document(3, {})  # should not raise

    sql_log = [entry[0] for entry in conn.executed]
    assert any("INSERT INTO chunks" in sql for sql in sql_log)


def test_embed_chunks_assigns_vector_ids_to_unembedded_chunks():
    chunks = [
        {"id": 10, "document_id": 4, "chunk_index": 0, "vector_id": None},
        {"id": 11, "document_id": 4, "chunk_index": 1, "vector_id": None},
    ]
    conn = FakeConnection(documents=[_make_document(4)], chunks=chunks)
    worker = IngestionWorker(conn)

    worker.embed_chunks(4, {})

    entries = conn.executed
    update_entries = [(sql, params) for sql, params in entries if "UPDATE chunks SET vector_id" in sql]
    assert len(update_entries) == 2
    vector_ids = {params[0] for _, params in update_entries}
    assert len(vector_ids) == 2  # both chunks get distinct vector IDs


def test_embed_chunks_skips_already_embedded_chunks():
    # FakeConnection.get_chunks filters by vector_id IS NULL via test setup –
    # here we return empty list to simulate all chunks already embedded.
    conn = FakeConnection(documents=[_make_document(6)], chunks=[])
    worker = IngestionWorker(conn)

    worker.embed_chunks(6, {})

    sql_log = [entry[0] for entry in conn.executed]
    assert not any("UPDATE chunks SET vector_id" in sql for sql in sql_log)


def test_index_chunks_marks_document_as_indexed():
    conn = FakeConnection(documents=[_make_document(7)])
    worker = IngestionWorker(conn)

    worker.index_chunks(7, {})

    sql_log = [entry[0] for entry in conn.executed]
    assert any("UPDATE documents SET status = 'indexed'" in sql for sql in sql_log)


# ---------------------------------------------------------------------------
# _split_into_chunks helper tests
# ---------------------------------------------------------------------------


def test_split_into_chunks_empty_string_returns_empty():
    assert _split_into_chunks("") == []
    assert _split_into_chunks("   ") == []


def test_split_into_chunks_short_text_returns_single_chunk():
    result = _split_into_chunks("short", chunk_size=500)
    assert result == ["short"]


def test_split_into_chunks_long_text_returns_multiple_chunks():
    text = "a" * 1200
    chunks = _split_into_chunks(text, chunk_size=500, overlap=50)
    assert len(chunks) > 1
    assert all(len(c) <= 500 for c in chunks)
