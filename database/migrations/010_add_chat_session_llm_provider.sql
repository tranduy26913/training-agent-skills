-- Migration 010: Add llm_provider column to chat_sessions table
-- チャットセッションテーブルにLLMプロバイダーカラムを追加するマイグレーション
-- CR-NBLM-LLM-001: Per-session LLM provider selection

-- UP

ALTER TABLE `chat_sessions`
  ADD COLUMN `llm_provider` ENUM('ollama', 'mock', 'gemini') NOT NULL DEFAULT 'ollama'
  AFTER `title`;
