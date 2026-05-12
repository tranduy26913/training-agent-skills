"""
LLM Provider abstraction for NotebookLM query worker.
/ NotebookLMクエリワーカーのLLMプロバイダー抽象モジュール。

Supports three backends:
  - ollama: Calls POST {LLM_API_URL}/api/generate (real Ollama server)
  - mock:   Same HTTP shape as Ollama, routes to mock_ollama_server
    - gemini: Uses google-genai SDK via GEMINI_API_KEY env variable

Factory function: create_llm_provider(provider_name) -> LLMProvider
"""
from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from abc import ABC, abstractmethod

try:
    from google import genai  # type: ignore[import]
except ImportError:  # pragma: no cover
    genai = None  # type: ignore[assignment]

# デフォルト設定 / Default configuration values
_DEFAULT_LLM_API_URL = "http://localhost:11434"
_DEFAULT_LLM_MODEL = "llama3"

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    """
    Abstract base class for all LLM providers.
    / 全LLMプロバイダーの抽象基底クラス。
    """

    @abstractmethod
    def generate(self, prompt: str, timeout: int = 30) -> str:
        """
        Generate an answer for the given prompt.
        / 指定されたプロンプトに対して回答を生成する。

        Args:
            prompt: The full prompt string including context and question.
            timeout: Request timeout in seconds.

        Returns:
            The generated answer as a plain string.
        """


class OllamaProvider(LLMProvider):
    """
    LLM provider that calls an Ollama-compatible HTTP endpoint.
    Used for both the real Ollama server and the mock development server.
    / Ollama互換HTTPエンドポイントを呼び出すLLMプロバイダー。
    本物のOllamaサーバーおよびモック開発サーバーの両方に使用する。
    """

    def __init__(
        self,
        api_url: str | None = None,
        model: str | None = None,
    ) -> None:
        # 環境変数からAPIのURLとモデル名を読み込む / Load API URL and model from env
        self.api_url = (api_url or os.environ.get("LLM_API_URL", _DEFAULT_LLM_API_URL)).rstrip("/")
        self.model = model or os.environ.get("LLM_MODEL", _DEFAULT_LLM_MODEL)

    def generate(self, prompt: str, timeout: int = 30) -> str:
        """
        Call Ollama /api/generate (non-streaming) and return the response text.
        / Ollama /api/generate を呼び出し（非ストリーミング）、応答テキストを返す。
        """
        url = f"{self.api_url}/api/generate"
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


class GeminiProvider(LLMProvider):
    """
    LLM provider that uses Google Gemini via the google-genai SDK.
    / google-genai SDKを使用してGoogle Geminiを呼び出すLLMプロバイダー。

    Requires environment variables:
      GEMINI_API_KEY  - Google Gemini API key (mandatory)
      GEMINI_MODEL    - Model name (optional, e.g. 'gemini-pro')
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
    ) -> None:
        # APIキーを環境変数から読み込む / Load API key from env
        resolved_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not resolved_key:
            raise ValueError("GEMINI_API_KEY is required for GeminiProvider but was not set")
        self._api_key = resolved_key
        self._model_name = model or os.environ.get("GEMINI_MODEL", "gemini-pro")
        if genai is None:  # pragma: no cover
            raise ImportError("google-genai package is required for GeminiProvider")
        self._client = genai.Client(api_key=self._api_key)

    def generate(self, prompt: str, timeout: int = 30) -> str:  # noqa: ARG002
        """
        Send prompt to Gemini via the google-genai SDK and return the response text.
        / google-genai SDKを通じてGeminiにプロンプトを送信し、応答テキストを返す。
        """
        logger.debug(
            "Gemini request started: model=%s prompt_chars=%s",
            self._model_name,
            len(prompt),
        )
        response = self._client.models.generate_content(model=self._model_name, contents=prompt)
        response_text = str(response.text or "").strip()
        logger.debug(
            "Gemini request completed: model=%s response_chars=%s",
            self._model_name,
            len(response_text),
        )
        return response_text


def create_llm_provider(provider_name: str) -> LLMProvider:
    """
    Factory: instantiate the appropriate LLM provider from a provider name string.
    / ファクトリー: プロバイダー名文字列から適切なLLMプロバイダーをインスタンス化する。

    Supported provider_name values:
      'ollama' -> OllamaProvider (uses LLM_API_URL / LLM_MODEL env vars)
      'mock'   -> OllamaProvider (same HTTP shape, targets mock server)
            'gemini' -> GeminiProvider (uses GEMINI_API_KEY / GEMINI_MODEL env vars)

    Raises:
        ValueError: If provider_name is not one of the supported values.
    """
    normalized_name = str(provider_name).strip().lower()
    logger.debug("Resolving LLM provider: raw=%r normalized=%r", provider_name, normalized_name)

    if normalized_name in ("ollama", "mock"):
        return OllamaProvider()
    if normalized_name == "gemini":
        return GeminiProvider()
    raise ValueError(
        f"Unsupported LLM provider: '{provider_name}'. "
        "Supported values are 'ollama', 'mock', 'gemini'."
    )
