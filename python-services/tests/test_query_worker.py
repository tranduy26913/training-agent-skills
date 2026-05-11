from __future__ import annotations

import json

import pytest

from workers.query_worker import QueryWorker


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
        elif "SELECT" in normalized and "FROM chunks" in normalized:
            self._fetchall_rows = list(self.connection.chunk_rows)

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
    def __init__(self, jobs=None, chunk_rows=None) -> None:
        self.jobs = list(jobs or [])
        self.chunk_rows: list[dict] = list(chunk_rows or [])
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


def _make_job(job_id: int = 1, query_text: str = "what is AI", workspace_id: int = 10,
              retry_count: int = 0, max_retries: int = 3) -> dict:
    return {
        "id": job_id,
        "type": "QUERY",
        "payload": {"query_text": query_text, "workspace_id": workspace_id},
        "retry_count": retry_count,
        "max_retries": max_retries,
    }


# ---------------------------------------------------------------------------
# run_once queue-flow tests
# ---------------------------------------------------------------------------


def test_run_once_query_happy_path_marks_job_and_steps_complete():
    conn = FakeConnection(jobs=[_make_job(job_id=1)])
    worker = QueryWorker(conn)

    processed = worker.run_once()

    assert processed is True
    assert conn.commits == 1
    sql_log = [entry[0] for entry in conn.executed]
    assert any("UPDATE jobs SET status = 'processing'" in sql for sql in sql_log)
    assert any("UPDATE jobs SET status = 'done'" in sql for sql in sql_log)
    assert any("ON DUPLICATE KEY UPDATE status = 'running'" in sql for sql in sql_log)


def test_run_once_query_returns_false_when_no_job():
    conn = FakeConnection()
    worker = QueryWorker(conn)

    processed = worker.run_once()

    assert processed is False
    assert conn.commits == 1


def test_run_once_query_failure_requeues_before_max_retry():
    conn = FakeConnection(jobs=[_make_job(job_id=2, retry_count=0)])
    worker = QueryWorker(conn)

    def crash(*args, **kwargs):
        raise RuntimeError("retrieval timeout")

    worker.retrieve_context = crash

    processed = worker.run_once()

    assert processed is True
    sql_log = [entry[0] for entry in conn.executed]
    assert any("retry_count = retry_count + 1" in sql for sql in sql_log)
    assert any("UPDATE jobs SET status = 'pending'" in sql for sql in sql_log)


def test_run_once_query_failure_moves_to_dead_letter_at_max_retry():
    conn = FakeConnection(jobs=[_make_job(job_id=3, retry_count=2)])
    worker = QueryWorker(conn)

    def crash(*args, **kwargs):
        raise RuntimeError("synthesis failed")

    worker.synthesize_answer = crash

    processed = worker.run_once()

    assert processed is True
    sql_log = [entry[0] for entry in conn.executed]
    assert any("status = 'dead_letter'" in sql for sql in sql_log)


# ---------------------------------------------------------------------------
# prepare_query tests
# ---------------------------------------------------------------------------


def test_prepare_query_sets_internal_keys():
    conn = FakeConnection()
    worker = QueryWorker(conn)
    payload = {"query_text": "  hello world  ", "workspace_id": 5}

    worker.prepare_query(payload, {})

    assert payload["_query"] == "hello world"
    assert payload["_workspace_id"] == 5


def test_prepare_query_raises_when_query_text_empty():
    conn = FakeConnection()
    worker = QueryWorker(conn)

    with pytest.raises(ValueError, match="query_text"):
        worker.prepare_query({"query_text": "", "workspace_id": 1}, {})


def test_prepare_query_raises_when_workspace_id_missing():
    conn = FakeConnection()
    worker = QueryWorker(conn)

    with pytest.raises(ValueError, match="workspace_id"):
        worker.prepare_query({"query_text": "question"}, {})


# ---------------------------------------------------------------------------
# retrieve_context tests
# ---------------------------------------------------------------------------


def test_retrieve_context_returns_matching_chunks():
    chunk_rows = [{"chunk_text": "AI is transforming the world"}]
    conn = FakeConnection(chunk_rows=chunk_rows)
    worker = QueryWorker(conn)
    payload = {"_query": "AI world", "_workspace_id": 10}

    worker.retrieve_context(payload, {})

    assert payload["_chunks"] == ["AI is transforming the world"]
    sql_log = [entry[0] for entry in conn.executed]
    assert any("FROM chunks" in sql for sql in sql_log)


def test_retrieve_context_sets_empty_chunks_when_no_matches():
    conn = FakeConnection(chunk_rows=[])
    worker = QueryWorker(conn)
    payload = {"_query": "unknown topic", "_workspace_id": 10}

    worker.retrieve_context(payload, {})

    assert payload["_chunks"] == []


def test_retrieve_context_sets_empty_when_query_blank():
    conn = FakeConnection()
    worker = QueryWorker(conn)
    payload = {"_query": "", "_workspace_id": 10}

    worker.retrieve_context(payload, {})

    assert payload["_chunks"] == []
    sql_log = [entry[0] for entry in conn.executed]
    assert not any("FROM chunks" in sql for sql in sql_log)


# ---------------------------------------------------------------------------
# synthesize_answer tests
# ---------------------------------------------------------------------------


def test_synthesize_answer_builds_answer_from_chunks():
    conn = FakeConnection()
    worker = QueryWorker(conn)
    payload = {"_query": "what is AI", "_chunks": ["AI stands for artificial intelligence."]}

    worker.synthesize_answer(payload, {})

    assert "Based on the documents" in payload["_answer"]
    assert "AI stands for artificial intelligence." in payload["_answer"]


def test_synthesize_answer_fallback_when_no_chunks():
    conn = FakeConnection()
    worker = QueryWorker(conn)
    payload = {"_query": "obscure topic", "_chunks": []}

    worker.synthesize_answer(payload, {})

    assert "No relevant context found" in payload["_answer"]
    assert "obscure topic" in payload["_answer"]


# ---------------------------------------------------------------------------
# store_result tests
# ---------------------------------------------------------------------------


def test_store_result_updates_job_payload_with_answer():
    conn = FakeConnection()
    worker = QueryWorker(conn)
    job = {"id": 42}
    payload = {"query_text": "what is AI", "workspace_id": 1, "_answer": "AI is ..."}

    worker.store_result(payload, job)

    entries = conn.executed
    update_entries = [(sql, params) for sql, params in entries if "UPDATE jobs SET payload" in sql]
    assert len(update_entries) == 1
    stored_json = update_entries[0][1][0]
    stored = json.loads(stored_json)
    assert stored["answer"] == "AI is ..."
    assert "query_text" in stored
    assert "_answer" not in stored  # internal keys stripped


def test_store_result_strips_internal_keys_from_payload():
    conn = FakeConnection()
    worker = QueryWorker(conn)
    job = {"id": 99}
    payload = {
        "query_text": "test",
        "workspace_id": 5,
        "_query": "test",
        "_chunks": ["chunk"],
        "_workspace_id": 5,
        "_answer": "result",
    }

    worker.store_result(payload, job)

    stored_json = conn.executed[-1][1][0]
    stored = json.loads(stored_json)
    internal_keys = [k for k in stored if k.startswith("_")]
    assert internal_keys == []
