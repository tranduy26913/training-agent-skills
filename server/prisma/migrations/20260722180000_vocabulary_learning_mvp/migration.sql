-- Vocabulary-only learning MVP (phases 7–10).
-- Legacy course/kanji-oriented tables are intentionally removed: the product
-- now teaches vocabulary only. Take a backup before deploying to production.

ALTER TABLE "users"
  ADD COLUMN "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  ADD COLUMN "daily_learning_item_goal" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "vocabularies"
  ADD COLUMN "slug" VARCHAR(180),
  ADD COLUMN "example" VARCHAR(1000);

UPDATE "vocabularies"
SET "slug" = 'vocabulary-' || "id"
WHERE "slug" IS NULL;

ALTER TABLE "vocabularies" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "vocabularies_slug_key" ON "vocabularies"("slug");

DROP TABLE IF EXISTS "quiz_attempts" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "quizzes" CASCADE;
DROP TABLE IF EXISTS "lesson_progress" CASCADE;
DROP TABLE IF EXISTS "lesson_sections" CASCADE;
DROP TABLE IF EXISTS "lessons" CASCADE;
DROP TABLE IF EXISTS "units" CASCADE;
DROP TABLE IF EXISTS "course_enrollments" CASCADE;
DROP TABLE IF EXISTS "courses" CASCADE;
DROP TABLE IF EXISTS "learning_sessions" CASCADE;

CREATE TABLE "vocabulary_lessons" (
  "id" SERIAL NOT NULL,
  "level" VARCHAR(20) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "position" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vocabulary_lessons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vocabulary_lessons_level_position_key" ON "vocabulary_lessons"("level", "position");
CREATE INDEX "vocabulary_lessons_level_status_idx" ON "vocabulary_lessons"("level", "status");

CREATE TABLE "lesson_vocabularies" (
  "id" SERIAL NOT NULL,
  "lesson_id" INTEGER NOT NULL,
  "vocabulary_id" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "is_introduced" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "lesson_vocabularies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "lesson_vocabularies_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "vocabulary_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "lesson_vocabularies_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "lesson_vocabularies_lesson_id_vocabulary_id_key" ON "lesson_vocabularies"("lesson_id", "vocabulary_id");
CREATE UNIQUE INDEX "lesson_vocabularies_lesson_id_position_key" ON "lesson_vocabularies"("lesson_id", "position");
CREATE INDEX "lesson_vocabularies_vocabulary_id_idx" ON "lesson_vocabularies"("vocabulary_id");

CREATE TABLE "user_vocabularies" (
  "id" SERIAL NOT NULL, "user_id" INTEGER NOT NULL, "vocabulary_id" INTEGER NOT NULL,
  "first_seen_at" TIMESTAMP(3), "is_favorite" BOOLEAN NOT NULL DEFAULT false,
  "is_suspended" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_vocabularies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_vocabularies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_vocabularies_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "user_vocabularies_user_id_vocabulary_id_key" ON "user_vocabularies"("user_id", "vocabulary_id");
CREATE INDEX "user_vocabularies_user_id_first_seen_at_idx" ON "user_vocabularies"("user_id", "first_seen_at");

CREATE TABLE "flashcard_sessions" (
  "id" SERIAL NOT NULL, "user_id" INTEGER NOT NULL, "lesson_id" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active', "current_index" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMP(3),
  CONSTRAINT "flashcard_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flashcard_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "flashcard_sessions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "vocabulary_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "flashcard_sessions_user_id_status_idx" ON "flashcard_sessions"("user_id", "status");

CREATE TABLE "flashcard_session_items" (
  "id" SERIAL NOT NULL, "session_id" INTEGER NOT NULL, "vocabulary_id" INTEGER NOT NULL,
  "position" INTEGER NOT NULL, "revealed_at" TIMESTAMP(3),
  CONSTRAINT "flashcard_session_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flashcard_session_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "flashcard_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "flashcard_session_items_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "flashcard_session_items_session_id_vocabulary_id_key" ON "flashcard_session_items"("session_id", "vocabulary_id");
CREATE UNIQUE INDEX "flashcard_session_items_session_id_position_key" ON "flashcard_session_items"("session_id", "position");

CREATE TABLE "vocabulary_quiz_attempts" (
  "id" SERIAL NOT NULL, "user_id" INTEGER NOT NULL, "lesson_id" INTEGER NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active', "score" INTEGER, "snapshot" JSONB NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "submitted_at" TIMESTAMP(3),
  CONSTRAINT "vocabulary_quiz_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vocabulary_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "vocabulary_quiz_attempts_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "vocabulary_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "vocabulary_quiz_attempts_user_id_lesson_id_status_idx" ON "vocabulary_quiz_attempts"("user_id", "lesson_id", "status");

CREATE TABLE "vocabulary_quiz_answers" (
  "id" SERIAL NOT NULL, "attempt_id" INTEGER NOT NULL, "vocabulary_id" INTEGER NOT NULL,
  "answer" VARCHAR(1000) NOT NULL, "is_correct" BOOLEAN NOT NULL, "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vocabulary_quiz_answers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vocabulary_quiz_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "vocabulary_quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "vocabulary_quiz_answers_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "vocabulary_quiz_answers_attempt_id_vocabulary_id_key" ON "vocabulary_quiz_answers"("attempt_id", "vocabulary_id");

CREATE TABLE "learning_reviews" (
  "id" SERIAL NOT NULL, "user_id" INTEGER NOT NULL, "vocabulary_id" INTEGER NOT NULL,
  "due_at" TIMESTAMP(3) NOT NULL, "interval_days" INTEGER NOT NULL DEFAULT 0,
  "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5, "repetitions" INTEGER NOT NULL DEFAULT 0,
  "last_reviewed_at" TIMESTAMP(3), CONSTRAINT "learning_reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learning_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "learning_reviews_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "learning_reviews_user_id_vocabulary_id_key" ON "learning_reviews"("user_id", "vocabulary_id");
CREATE INDEX "learning_reviews_user_id_due_at_idx" ON "learning_reviews"("user_id", "due_at");

CREATE TABLE "review_sessions" (
  "id" SERIAL NOT NULL, "user_id" INTEGER NOT NULL, "lesson_id" INTEGER,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active', "filter_snapshot" JSONB NOT NULL,
  "current_index" INTEGER NOT NULL DEFAULT 0, "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMP(3),
  CONSTRAINT "review_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "review_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "review_sessions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "vocabulary_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "review_sessions_user_id_status_idx" ON "review_sessions"("user_id", "status");

CREATE TABLE "review_session_items" (
  "id" SERIAL NOT NULL, "session_id" INTEGER NOT NULL, "vocabulary_id" INTEGER NOT NULL,
  "position" INTEGER NOT NULL, "rated_at" TIMESTAMP(3), "rating" INTEGER,
  CONSTRAINT "review_session_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "review_session_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "review_session_items_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "review_session_items_session_id_vocabulary_id_key" ON "review_session_items"("session_id", "vocabulary_id");
CREATE UNIQUE INDEX "review_session_items_session_id_position_key" ON "review_session_items"("session_id", "position");

CREATE TABLE "review_logs" (
  "id" SERIAL NOT NULL, "user_id" INTEGER NOT NULL, "vocabulary_id" INTEGER NOT NULL,
  "rating" INTEGER NOT NULL, "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "review_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "review_logs_user_id_reviewed_at_idx" ON "review_logs"("user_id", "reviewed_at");
