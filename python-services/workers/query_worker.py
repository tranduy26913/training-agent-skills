from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from workers.retry_policy import apply_retry_policy

# デフォルト設定 / Default configuration for the internal LLM API (Ollama)
_DEFAULT_LLM_API_URL = "http://localhost:11434"
_DEFAULT_LLM_MODEL = "llama3"


class OllamaClient:
    """
    Thin wrapper around the Ollama HTTP API.
    / Ollama HTTP APIへの薄いラッパークラス。

    Reads configuration from environment variables:
      LLM_API_URL  - base URL of the Ollama server  (default: http://localhost:11434)
      LLM_MODEL    - model name to use              (default: llama3)
    """

    def __init__(self) -> None:
        # 環境変数から設定を読み込む / Load config from env
        self.base_url = os.environ.get("LLM_API_URL", _DEFAULT_LLM_API_URL).rstrip("/")
        self.model = os.environ.get("LLM_MODEL", _DEFAULT_LLM_MODEL)

    def generate(self, prompt: str, timeout: int = 120) -> str:
        """
        Call Ollama /api/generate (non-streaming) and return the response text.
        / Ollama /api/generate を呼び出し（非ストリーミング）、応答テキストを返す。

        Raises urllib.error.URLError / OSError if the server is unreachable.
        """
        url = f"{self.base_url}/api/generate"
        body = json.dumps(
            {"model": self.model, "prompt": prompt, "stream": False},
            ensure_ascii=False,
        ).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
            result = json.loads(resp.read().decode("utf-8"))

        return str(result.get("response") or "").strip()

QUERY_JOB_TYPE = "QUERY"
QUERY_STEPS = ("prepare", "retrieve", "synthesize", "store")


class QueryWorker:
    """Queue consumer that runs query workflow steps for NotebookLM operations."""

    def __init__(
        self,
        connection: Any,
        default_max_retries: int = 3,
        llm_client: OllamaClient | None = None,
    ) -> None:
        # DB接続と最大リトライ数を保持 / Store DB connection and max retries
        self.connection = connection
        self.default_max_retries = default_max_retries
        # LLMクライアントのDIをサポート (テスト用) / Support DI of LLM client (for tests)
        self._llm = llm_client if llm_client is not None else OllamaClient()

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
        query_text = str(payload.get("query_text") or "").strip()
        workspace_id = payload.get("workspace_id")
        if not query_text:
            raise ValueError("query_text is required and must not be empty")
        if not workspace_id:
            raise ValueError("workspace_id is required")
        payload["_query"] = query_text
        payload["_workspace_id"] = int(workspace_id)

    def retrieve_context(self, payload: dict[str, Any], job: dict[str, Any]) -> None:
        """
        Retrieve relevant document chunks for the query.
        / クエリに関連するドキュメントチャンクを取得し、ソース情報も記録する。
        """
        workspace_id = int(payload.get("_workspace_id") or payload.get("workspace_id", 0))
        query_text = str(payload.get("_query") or payload.get("query_text") or "").strip()
        keywords = [w for w in query_text.split() if w][:5]
        if not keywords:
            payload["_chunks"] = []
            payload["_sources"] = []
            return
        conditions = " OR ".join(["c.chunk_text LIKE %s"] * len(keywords))
        kw_params = tuple(f"%{kw}%" for kw in keywords)
        sql = (
            f"SELECT c.chunk_text, c.document_id, d.filename "
            f"FROM chunks c "
            f"LEFT JOIN documents d ON d.id = c.document_id "
            f"WHERE ({conditions}) AND c.workspace_id = %s "
            f"LIMIT 10"
        )
        rows = self._fetch_all(sql, kw_params + (workspace_id,))
        payload["_chunks"] = [r["chunk_text"] for r in rows]
        # ソース情報を記録 / Record source document info for citation
        payload["_sources"] = [
            {
                "document_id": r.get("document_id"),
                "filename": r.get("filename") or "Unknown",
                "snippet": r["chunk_text"][:200],
            }
            for r in rows
        ]

    def synthesize_answer(self, payload: dict[str, Any], job: dict[str, Any]) -> None:
        """
        Generate an answer via the internal LLM API using retrieved chunks as context.
        Falls back to a plain-text summary when the LLM is unavailable.
        / 取得したチャンクをコンテキストとして内部LLM APIで回答を生成する。
        LLMが利用できない場合はプレーンテキストのサマリーにフォールバックする。
        """
        chunks = payload.get("_chunks") or []
        query_text = str(payload.get("_query") or payload.get("query_text") or "")

        if not chunks:
            # チャンクがない場合はデフォルトメッセージ / No chunks → default message
            payload["_answer"] = f"No relevant context found for query: {query_text}"
            return

        # プロンプトを構築 / Build RAG prompt with retrieved context
        context_text = "\n---\n".join(chunks[:5])
        prompt = (
            "You are a helpful assistant. Answer the user's question based only on the "
            "following document excerpts. Be concise and accurate.\n\n"
            f"Context:\n{context_text}\n\n"
            f"Question: {query_text}\n\n"
            "Answer:"
        )

        try:
            # LLM APIを呼び出す / Call the internal LLM API
            answer = self._llm.generate(prompt)
        except Exception as llm_error:  # noqa: BLE001
            # LLMが利用不可の場合はフォールバック / Fallback when LLM is unavailable
            import logging
            logging.getLogger(__name__).warning(
                "LLM API unavailable, falling back to plain-text answer: %s", llm_error
            )
            answer = f"Based on the documents:\n\n{context_text}"

        payload["_answer"] = answer

    def store_result(self, payload: dict[str, Any], job: dict[str, Any]) -> None:
        """
        Persist the synthesized answer:
          1. INSERT an assistant message into chat_messages (links back to the job)
          2. UPDATE jobs.payload with the final answer for audit/visibility
        / 合成された回答を永続化する:
          1. chat_messagesにアシスタントメッセージをINSERT（ジョブIDを関連付け）
          2. 監査用にjobs.payloadを最終回答で更新する
        """
        answer = str(payload.get("_answer") or "")
        session_id = payload.get("session_id")
        sources = payload.get("_sources") or []
        job_id = int(job["id"])

        # アシスタントメッセージをchat_messagesに保存 / Save assistant message to chat_messages
        if session_id:
            sources_json = json.dumps(sources, ensure_ascii=False) if sources else None
            self._execute(
                "INSERT INTO chat_messages (session_id, role, content, sources, job_id) "
                "VALUES (%s, 'assistant', %s, %s, %s)",
                (int(session_id), answer, sources_json, job_id),
            )

        # ジョブのペイロードを更新（監査・デバッグ用）/ Update job payload for audit
        result_payload = {k: v for k, v in payload.items() if not k.startswith("_")}
        result_payload["answer"] = answer
        self._execute(
            "UPDATE jobs SET payload = %s, updated_at = NOW() WHERE id = %s",
            (json.dumps(result_payload, ensure_ascii=False), job_id),
        )

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

    def _fetch_all(self, sql: str, params: tuple[Any, ...]) -> list[dict[str, Any]]:
        cursor = self.connection.cursor()
        try:
            cursor.execute(sql, params)
            return cursor.fetchall()
        finally:
            cursor.close()
