from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from workers.query_worker import OllamaClient, QueryWorker


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_worker_with_mock_llm(conn, llm_response: str = "Mocked LLM answer") -> tuple[QueryWorker, MagicMock]:
    """
    Create a QueryWorker with a mocked OllamaClient.
    / モックOllamaClientを持つQueryWorkerを生成する。
    """
    mock_llm = MagicMock(spec=OllamaClient)
    mock_llm.generate.return_value = llm_response
    return QueryWorker(conn, llm_client=mock_llm), mock_llm


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
        # INSERT INTO chat_messages and other writes need no special handling

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
    worker, _ = _make_worker_with_mock_llm(conn)

    processed = worker.run_once()

    assert processed is True
    assert conn.commits == 1
    sql_log = [entry[0] for entry in conn.executed]
    assert any("UPDATE jobs SET status = 'processing'" in sql for sql in sql_log)
    assert any("UPDATE jobs SET status = 'done'" in sql for sql in sql_log)
    assert any("ON DUPLICATE KEY UPDATE status = 'running'" in sql for sql in sql_log)


def test_run_once_query_returns_false_when_no_job():
    conn = FakeConnection()
    worker, _ = _make_worker_with_mock_llm(conn)

    processed = worker.run_once()

    assert processed is False
    assert conn.commits == 1


def test_run_once_query_failure_requeues_before_max_retry():
    conn = FakeConnection(jobs=[_make_job(job_id=2, retry_count=0)])
    worker, _ = _make_worker_with_mock_llm(conn)

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
    worker, _ = _make_worker_with_mock_llm(conn)

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
    chunk_rows = [{"chunk_text": "AI is transforming the world", "document_id": 1, "filename": "ai.pdf"}]
    conn = FakeConnection(chunk_rows=chunk_rows)
    worker = QueryWorker(conn)
    payload = {"_query": "AI world", "_workspace_id": 10}

    worker.retrieve_context(payload, {})

    assert payload["_chunks"] == ["AI is transforming the world"]
    assert payload["_sources"][0]["document_id"] == 1
    assert payload["_sources"][0]["filename"] == "ai.pdf"
    assert "AI is transforming" in payload["_sources"][0]["snippet"]
    sql_log = [entry[0] for entry in conn.executed]
    assert any("FROM chunks" in sql for sql in sql_log)


def test_retrieve_context_sets_empty_chunks_when_no_matches():
    conn = FakeConnection(chunk_rows=[])
    worker = QueryWorker(conn)
    payload = {"_query": "unknown topic", "_workspace_id": 10}

    worker.retrieve_context(payload, {})

    assert payload["_chunks"] == []
    assert payload["_sources"] == []


def test_retrieve_context_sets_empty_when_query_blank():
    conn = FakeConnection()
    worker = QueryWorker(conn)
    payload = {"_query": "", "_workspace_id": 10}

    worker.retrieve_context(payload, {})

    assert payload["_chunks"] == []
    assert payload["_sources"] == []
    sql_log = [entry[0] for entry in conn.executed]
    assert not any("FROM chunks" in sql for sql in sql_log)


# ---------------------------------------------------------------------------
# synthesize_answer tests
# ---------------------------------------------------------------------------


def test_synthesize_answer_calls_llm_with_chunks():
    """
    When chunks are available, synthesize_answer must call the LLM API and store its response.
    / チャンクが存在する場合、LLM APIを呼び出し応答を保存する。
    """
    conn = FakeConnection()
    worker, mock_llm = _make_worker_with_mock_llm(conn, llm_response="AI stands for Artificial Intelligence.")
    payload = {"_query": "what is AI", "_chunks": ["AI stands for artificial intelligence."]}

    worker.synthesize_answer(payload, {})

    mock_llm.generate.assert_called_once()
    prompt_used = mock_llm.generate.call_args[0][0]
    assert "what is AI" in prompt_used
    assert "AI stands for artificial intelligence." in prompt_used
    assert payload["_answer"] == "AI stands for Artificial Intelligence."


def test_synthesize_answer_builds_answer_from_chunks():
    """Backward-compat: answer is populated when chunks are present."""
    conn = FakeConnection()
    worker, mock_llm = _make_worker_with_mock_llm(conn, llm_response="AI is intelligence demonstrated by machines.")
    payload = {"_query": "what is AI", "_chunks": ["AI stands for artificial intelligence."]}

    worker.synthesize_answer(payload, {})

    assert payload["_answer"] == "AI is intelligence demonstrated by machines."


def test_synthesize_answer_fallback_when_no_chunks():
    """
    When no chunks, LLM is NOT called and the fallback message is stored.
    / チャンクがない場合、LLMは呼び出されずフォールバックメッセージが保存される。
    """
    conn = FakeConnection()
    worker, mock_llm = _make_worker_with_mock_llm(conn)
    payload = {"_query": "obscure topic", "_chunks": []}

    worker.synthesize_answer(payload, {})

    mock_llm.generate.assert_not_called()
    assert "No relevant context found" in payload["_answer"]
    assert "obscure topic" in payload["_answer"]


def test_synthesize_answer_falls_back_to_plain_text_when_llm_unavailable():
    """
    When the LLM API raises an error, synthesize_answer falls back to a plain-text summary.
    / LLM APIがエラーを発生させた場合、プレーンテキストのサマリーにフォールバックする。
    """
    conn = FakeConnection()
    mock_llm = MagicMock(spec=OllamaClient)
    mock_llm.generate.side_effect = OSError("Connection refused")
    worker = QueryWorker(conn, llm_client=mock_llm)
    payload = {"_query": "what is AI", "_chunks": ["AI stands for artificial intelligence."]}

    worker.synthesize_answer(payload, {})

    # LLMを呼んだが失敗 → フォールバック / Called LLM but failed → fallback
    mock_llm.generate.assert_called_once()
    assert "Based on the documents" in payload["_answer"]
    assert "AI stands for artificial intelligence." in payload["_answer"]


# ---------------------------------------------------------------------------
# store_result tests
# ---------------------------------------------------------------------------


def test_store_result_inserts_assistant_message_and_updates_job():
    """
    store_result must INSERT an assistant message into chat_messages AND update jobs.payload.
    / chat_messagesにアシスタントメッセージをINSERTし、jobs.payloadを更新する。
    """
    conn = FakeConnection()
    worker = QueryWorker(conn)
    job = {"id": 42}
    payload = {
        "query_text": "what is AI",
        "workspace_id": 1,
        "session_id": 7,
        "_answer": "AI is ...",
        "_sources": [{"document_id": 1, "filename": "ai.pdf", "snippet": "AI stands for..."}],
    }

    worker.store_result(payload, job)

    sql_log = [entry[0] for entry in conn.executed]

    # アシスタントメッセージのINSERTを確認 / Verify assistant message INSERT
    assert any("INSERT INTO chat_messages" in sql for sql in sql_log)
    insert_entry = next(e for e in conn.executed if "INSERT INTO chat_messages" in e[0])
    session_id_param, answer_param, sources_param, job_id_param = insert_entry[1]
    assert session_id_param == 7
    assert answer_param == "AI is ..."
    assert job_id_param == 42
    sources_stored = json.loads(sources_param)
    assert sources_stored[0]["document_id"] == 1

    # jobs.payloadのUPDATEを確認 / Verify jobs payload UPDATE
    update_entry = next(e for e in conn.executed if "UPDATE jobs SET payload" in e[0])
    stored = json.loads(update_entry[1][0])
    assert stored["answer"] == "AI is ..."
    assert "query_text" in stored
    assert "_answer" not in stored


def test_store_result_updates_job_payload_with_answer():
    """Backward-compat: job payload still contains the answer field."""
    conn = FakeConnection()
    worker = QueryWorker(conn)
    job = {"id": 42}
    payload = {"query_text": "what is AI", "workspace_id": 1, "_answer": "AI is ..."}

    worker.store_result(payload, job)

    update_entries = [(sql, params) for sql, params in conn.executed if "UPDATE jobs SET payload" in sql]
    assert len(update_entries) == 1
    stored_json = update_entries[0][1][0]
    stored = json.loads(stored_json)
    assert stored["answer"] == "AI is ..."
    assert "query_text" in stored
    assert "_answer" not in stored  # internal keys stripped


def test_store_result_skips_chat_message_insert_when_no_session_id():
    """
    When session_id is absent from payload, only jobs.payload is updated (no INSERT).
    / session_idがない場合、chat_messagesへのINSERTはスキップされる。
    """
    conn = FakeConnection()
    worker = QueryWorker(conn)
    job = {"id": 99}
    payload = {"query_text": "test", "workspace_id": 5, "_answer": "result"}

    worker.store_result(payload, job)

    sql_log = [entry[0] for entry in conn.executed]
    assert not any("INSERT INTO chat_messages" in sql for sql in sql_log)
    assert any("UPDATE jobs SET payload" in sql for sql in sql_log)


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
        "_sources": [],
    }

    worker.store_result(payload, job)

    stored_json = conn.executed[-1][1][0]
    stored = json.loads(stored_json)
    internal_keys = [k for k in stored if k.startswith("_")]
    assert internal_keys == []


# ---------------------------------------------------------------------------
# OllamaClient unit tests
# ---------------------------------------------------------------------------


def test_ollama_client_reads_env_vars(monkeypatch):
    """
    OllamaClient must read LLM_API_URL and LLM_MODEL from env vars.
    / 環境変数からLLM_API_URLとLLM_MODELを読み込むことを確認する。
    """
    monkeypatch.setenv("LLM_API_URL", "http://myserver:11434")
    monkeypatch.setenv("LLM_MODEL", "mistral")

    client = OllamaClient()

    assert client.base_url == "http://myserver:11434"
    assert client.model == "mistral"


def test_ollama_client_uses_defaults_when_env_not_set(monkeypatch):
    """
    When env vars are absent, OllamaClient uses default host and model.
    / 環境変数がない場合、デフォルトのホストとモデルを使用する。
    """
    monkeypatch.delenv("LLM_API_URL", raising=False)
    monkeypatch.delenv("LLM_MODEL", raising=False)

    client = OllamaClient()

    assert "localhost" in client.base_url
    assert client.model  # non-empty default


def test_ollama_client_generate_sends_correct_request():
    """
    OllamaClient.generate must POST to /api/generate with stream=False.
    / stream=FalseでPOSTリクエストを送信することを確認する。
    """
    fake_response_body = json.dumps({"response": "Hello from LLM", "done": True}).encode()

    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_resp = MagicMock()
        mock_resp.read.return_value = fake_response_body
        mock_resp.__enter__ = lambda s: s
        mock_resp.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_resp

        client = OllamaClient()
        result = client.generate("What is Python?")

    assert result == "Hello from LLM"
    call_args = mock_urlopen.call_args
    req = call_args[0][0]
    body = json.loads(req.data.decode())
    assert body["stream"] is False
    assert "What is Python?" in body["prompt"]
