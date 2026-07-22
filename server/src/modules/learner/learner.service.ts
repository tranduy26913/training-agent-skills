import { prisma } from "@database/prisma";
import { ServiceError } from "@models/common.model";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const vocabularySelect = {
  id: true,
  slug: true,
  kanji: true,
  hiragana: true,
  romaji: true,
  meaningVi: true,
  example: true,
  level: true,
} as const;
const normalize = (text: string) =>
  text.trim().normalize("NFKC").toLocaleLowerCase();
const assertOwned = <T extends { userId: number }>(
  row: T | null,
  userId: number,
): T => {
  if (!row || row.userId !== userId)
    throw new ServiceError("Resource not found", 404);
  return row;
};
const reviewSchedule = (
  rating: number,
  repetitions: number,
  easeFactor: number,
) => {
  const ease = Math.max(1.3, easeFactor + (rating - 3) * 0.12);
  const interval =
    rating <= 1
      ? 1
      : repetitions === 0
        ? 1
        : repetitions === 1
          ? 3
          : Math.round(Math.max(1, repetitions * ease));
  return {
    intervalDays: interval,
    easeFactor: ease,
    repetitions: rating <= 1 ? 0 : repetitions + 1,
  };
};

export class LearnerService {
  async levels(userId: number) {
    const [lessons, seen] = await Promise.all([
      prisma.vocabularyLesson.findMany({
        where: { status: "published" },
        include: {
          entries: {
            where: { isIntroduced: true },
            select: { vocabularyId: true },
          },
        },
      }),
      prisma.userVocabulary.findMany({
        where: { userId, firstSeenAt: { not: null } },
        select: { vocabularyId: true },
      }),
    ]);
    const seenIds = new Set(seen.map((x) => x.vocabularyId));
    return LEVELS.map((level) => {
      const ids = lessons
        .filter((lesson) => lesson.level === level)
        .flatMap((lesson) => lesson.entries.map((entry) => entry.vocabularyId));
      const unique = [...new Set(ids)];
      const learned = unique.filter((id) => seenIds.has(id)).length;
      return {
        level,
        lessonCount: lessons.filter((lesson) => lesson.level === level).length,
        total: unique.length,
        learned,
        progress: unique.length
          ? Math.round((learned / unique.length) * 100)
          : 0,
      };
    });
  }

  async lessons(userId: number, level: string) {
    if (!LEVELS.includes(level)) throw new ServiceError("Invalid level", 400);
    const rows = await prisma.vocabularyLesson.findMany({
      where: { level, status: "published" },
      orderBy: { position: "asc" },
      include: {
        entries: {
          where: { isIntroduced: true },
          select: {
            vocabularyId: true,
            vocabulary: { select: { status: true, isDeleted: true } },
          },
        },
      },
    });
    const seen = new Set(
      (
        await prisma.userVocabulary.findMany({
          where: { userId, firstSeenAt: { not: null } },
          select: { vocabularyId: true },
        })
      ).map((x) => x.vocabularyId),
    );
    return rows.map((lesson) => {
      const ids = lesson.entries
        .filter(
          (x) => x.vocabulary.status === "published" && !x.vocabulary.isDeleted,
        )
        .map((x) => x.vocabularyId);
      const learned = ids.filter((id) => seen.has(id)).length;
      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        position: lesson.position,
        total: ids.length,
        learned,
        progress: ids.length ? Math.round((learned / ids.length) * 100) : 0,
      };
    });
  }

  async lesson(userId: number, lessonId: number) {
    const lesson = await prisma.vocabularyLesson.findFirst({
      where: { id: lessonId, status: "published" },
      include: {
        entries: {
          orderBy: { position: "asc" },
          include: {
            vocabulary: {
              select: { ...vocabularySelect, status: true, isDeleted: true },
            },
          },
        },
      },
    });
    if (!lesson) throw new ServiceError("Lesson not found", 404);
    const progress = await prisma.userVocabulary.findMany({
      where: {
        userId,
        vocabularyId: { in: lesson.entries.map((x) => x.vocabularyId) },
      },
      select: { vocabularyId: true, firstSeenAt: true, isFavorite: true },
    });
    const states = new Map(progress.map((x) => [x.vocabularyId, x]));
    const words = lesson.entries
      .filter(
        (x) => x.vocabulary.status === "published" && !x.vocabulary.isDeleted,
      )
      .map((entry) => ({
        ...entry.vocabulary,
        position: entry.position,
        isIntroduced: entry.isIntroduced,
        learned: Boolean(states.get(entry.vocabularyId)?.firstSeenAt),
        favorite: Boolean(states.get(entry.vocabularyId)?.isFavorite),
      }));
    const introduced = words.filter((x) => x.isIntroduced);
    return {
      id: lesson.id,
      level: lesson.level,
      title: lesson.title,
      description: lesson.description,
      position: lesson.position,
      total: introduced.length,
      learned: introduced.filter((x) => x.learned).length,
      vocabularies: words,
    };
  }

  async vocabulary(userId: number, slug: string) {
    const word = await prisma.vocabulary.findFirst({
      where: { slug, status: "published", isDeleted: false },
      select: vocabularySelect,
    });
    if (!word) throw new ServiceError("Vocabulary not found", 404);
    const [state, origins] = await Promise.all([
      prisma.userVocabulary.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId: word.id } },
        select: { isFavorite: true, firstSeenAt: true },
      }),
      prisma.lessonVocabulary.findMany({
        where: { vocabularyId: word.id },
        include: {
          lesson: {
            select: { id: true, level: true, title: true, position: true },
          },
        },
        orderBy: { lesson: { position: "asc" } },
      }),
    ]);
    return {
      ...word,
      favorite: state?.isFavorite ?? false,
      learned: Boolean(state?.firstSeenAt),
      origins: origins.map((x) => x.lesson),
    };
  }

  async favorite(userId: number, vocabularyId: number, isFavorite: boolean) {
    const word = await prisma.vocabulary.findFirst({
      where: { id: vocabularyId, status: "published", isDeleted: false },
    });
    if (!word) throw new ServiceError("Vocabulary not found", 404);
    const previous = await prisma.userVocabulary.upsert({
      where: { userId_vocabularyId: { userId, vocabularyId } },
      create: { userId, vocabularyId, isFavorite },
      update: { isFavorite },
    });
    return { vocabularyId, isFavorite: previous.isFavorite };
  }

  async startFlashcards(userId: number, lessonId: number) {
    const active = await prisma.flashcardSession.findFirst({
      where: { userId, status: "active" },
      orderBy: { startedAt: "desc" },
    });
    if (active) return this.flashcardSession(userId, active.id);
    const hub = await this.lesson(userId, lessonId);
    const unseen = hub.vocabularies
      .filter((word) => word.isIntroduced && !word.learned)
      .slice(0, 10);
    if (!unseen.length)
      throw new ServiceError("No new vocabulary in this lesson", 409);
    const session = await prisma.flashcardSession.create({
      data: {
        userId,
        lessonId,
        items: {
          create: unseen.map((word, position) => ({
            vocabularyId: word.id,
            position,
          })),
        },
      },
    });
    return this.flashcardSession(userId, session.id);
  }

  async flashcardSession(userId: number, sessionId: number) {
    const session = assertOwned(
      await prisma.flashcardSession.findUnique({
        where: { id: sessionId },
        include: {
          lesson: { select: { id: true, level: true, title: true } },
          items: {
            orderBy: { position: "asc" },
            include: { vocabulary: { select: vocabularySelect } },
          },
        },
      }),
      userId,
    );
    const current =
      session.items.find((item) => item.position === session.currentIndex) ??
      null;
    return {
      id: session.id,
      status: session.status,
      currentIndex: session.currentIndex,
      total: session.items.length,
      lesson: session.lesson,
      current: current && {
        id: current.id,
        revealedAt: current.revealedAt,
        vocabulary: current.vocabulary,
      },
    };
  }

  async reveal(userId: number, sessionId: number, itemId: number) {
    const session = assertOwned(
      await prisma.flashcardSession.findUnique({
        where: { id: sessionId },
        include: { items: true },
      }),
      userId,
    );
    if (session.status !== "active")
      throw new ServiceError("Session is not active", 409);
    const item = session.items.find((x) => x.id === itemId);
    if (!item || item.position !== session.currentIndex)
      throw new ServiceError("Invalid flashcard item", 400);
    const now = new Date();
    await prisma.$transaction([
      prisma.flashcardSessionItem.update({
        where: { id: itemId },
        data: { revealedAt: item.revealedAt ?? now },
      }),
      prisma.userVocabulary.upsert({
        where: {
          userId_vocabularyId: { userId, vocabularyId: item.vocabularyId },
        },
        create: { userId, vocabularyId: item.vocabularyId, firstSeenAt: now },
        update: { firstSeenAt: { set: item.revealedAt ?? now } },
      }),
      prisma.learningReview.upsert({
        where: {
          userId_vocabularyId: { userId, vocabularyId: item.vocabularyId },
        },
        create: { userId, vocabularyId: item.vocabularyId, dueAt: now },
        update: {},
      }),
      prisma.flashcardSession.update({
        where: { id: sessionId },
        data: {
          currentIndex: Math.min(
            session.currentIndex + 1,
            session.items.length,
          ),
        },
      }),
    ]);
    return this.flashcardSession(userId, sessionId);
  }

  async completeFlashcards(userId: number, sessionId: number) {
    const session = assertOwned(
      await prisma.flashcardSession.findUnique({ where: { id: sessionId } }),
      userId,
    );
    await prisma.flashcardSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        completedAt: session.completedAt ?? new Date(),
      },
    });
    return { id: sessionId, status: "completed", lessonId: session.lessonId };
  }

  async startQuiz(userId: number, lessonId: number) {
    const active = await prisma.vocabularyQuizAttempt.findFirst({
      where: { userId, lessonId, status: "active" },
      orderBy: { startedAt: "desc" },
    });
    if (active) return this.quiz(userId, active.id);
    const hub = await this.lesson(userId, lessonId);
    const items = hub.vocabularies
      .filter((x) => x.isIntroduced)
      .slice(0, 10)
      .map((x) => ({
        id: x.id,
        prompt: x.kanji,
        reading: x.hiragana,
        meaning: x.meaningVi,
      }));
    if (!items.length) throw new ServiceError("Lesson has no vocabulary", 409);
    const attempt = await prisma.vocabularyQuizAttempt.create({
      data: { userId, lessonId, snapshot: items },
    });
    return this.quiz(userId, attempt.id);
  }

  async quiz(userId: number, attemptId: number) {
    const attempt = assertOwned(
      await prisma.vocabularyQuizAttempt.findUnique({
        where: { id: attemptId },
        include: { answers: true },
      }),
      userId,
    );
    const items = attempt.snapshot as Array<{
      id: number;
      prompt: string;
      reading: string | null;
      meaning: string;
    }>;
    return {
      id: attempt.id,
      status: attempt.status,
      lessonId: attempt.lessonId,
      score: attempt.score,
      questions: items.map((x) => ({
        vocabularyId: x.id,
        prompt: x.prompt,
        type: "meaning",
        answer:
          attempt.answers.find((a) => a.vocabularyId === x.id)?.answer ?? null,
      })),
      submittedAt: attempt.submittedAt,
    };
  }

  async answerQuiz(
    userId: number,
    attemptId: number,
    vocabularyId: number,
    answer: string,
  ) {
    const attempt = assertOwned(
      await prisma.vocabularyQuizAttempt.findUnique({
        where: { id: attemptId },
      }),
      userId,
    );
    if (attempt.status !== "active")
      throw new ServiceError("Quiz has been submitted", 409);
    const items = attempt.snapshot as Array<{ id: number; meaning: string }>;
    const item = items.find((x) => x.id === vocabularyId);
    if (!item || !answer.trim())
      throw new ServiceError("Invalid quiz answer", 400);
    const isCorrect = normalize(answer) === normalize(item.meaning);
    await prisma.vocabularyQuizAnswer.upsert({
      where: { attemptId_vocabularyId: { attemptId, vocabularyId } },
      create: { attemptId, vocabularyId, answer: answer.trim(), isCorrect },
      update: { answer: answer.trim(), isCorrect, answeredAt: new Date() },
    });
    return { vocabularyId, saved: true };
  }

  async submitQuiz(userId: number, attemptId: number) {
    const attempt = assertOwned(
      await prisma.vocabularyQuizAttempt.findUnique({
        where: { id: attemptId },
        include: { answers: true },
      }),
      userId,
    );
    if (attempt.status === "submitted")
      return {
        id: attempt.id,
        score: attempt.score,
        passed: (attempt.score ?? 0) >= 70,
      };
    const total = (attempt.snapshot as unknown[]).length;
    if (attempt.answers.length !== total)
      throw new ServiceError("Answer every question before submitting", 409);
    const score = Math.round(
      (attempt.answers.filter((x) => x.isCorrect).length / total) * 100,
    );
    const wrongVocabularyIds = attempt.answers
      .filter((x) => !x.isCorrect)
      .map((x) => x.vocabularyId);
    const now = new Date();
    await prisma.$transaction([
      prisma.vocabularyQuizAttempt.update({
        where: { id: attemptId },
        data: { status: "submitted", score, submittedAt: now },
      }),
      ...wrongVocabularyIds.map((vocabularyId) =>
        prisma.learningReview.upsert({
          where: { userId_vocabularyId: { userId, vocabularyId } },
          create: { userId, vocabularyId, dueAt: now },
          update: { dueAt: now },
        }),
      ),
    ]);
    return { id: attemptId, score, passed: score >= 70, wrongVocabularyIds };
  }

  async reviewSummary(userId: number) {
    const due = await prisma.learningReview.count({
      where: { userId, dueAt: { lte: new Date() } },
    });
    return { due };
  }
  async startReview(userId: number, level?: string, lessonId?: number) {
    const reviews = await prisma.learningReview.findMany({
      where: {
        userId,
        dueAt: { lte: new Date() },
        vocabulary: {
          level: level || undefined,
          status: "published",
          isDeleted: false,
          lessonEntries: lessonId
            ? { some: { lessonId: Number(lessonId) } }
            : undefined,
        },
      },
      orderBy: { dueAt: "asc" },
      take: 20,
    });
    if (!reviews.length)
      throw new ServiceError("No vocabulary due for review", 409);
    const session = await prisma.reviewSession.create({
      data: {
        userId,
        lessonId: lessonId ? Number(lessonId) : null,
        filterSnapshot: { level: level ?? null },
        items: {
          create: reviews.map((x, position) => ({
            vocabularyId: x.vocabularyId,
            position,
          })),
        },
      },
    });
    return this.reviewSession(userId, session.id);
  }
  async reviewSession(userId: number, sessionId: number) {
    const session = assertOwned(
      await prisma.reviewSession.findUnique({
        where: { id: sessionId },
        include: {
          items: {
            orderBy: { position: "asc" },
            include: { vocabulary: { select: vocabularySelect } },
          },
        },
      }),
      userId,
    );
    const current =
      session.items.find((x) => x.position === session.currentIndex) ?? null;
    return {
      id: session.id,
      status: session.status,
      total: session.items.length,
      currentIndex: session.currentIndex,
      current: current && {
        id: current.id,
        vocabulary: current.vocabulary,
        ratedAt: current.ratedAt,
      },
    };
  }
  async rateReview(
    userId: number,
    sessionId: number,
    itemId: number,
    rating: number,
  ) {
    if (!Number.isInteger(rating) || rating < 0 || rating > 3)
      throw new ServiceError("Rating must be from 0 to 3", 400);
    const session = assertOwned(
      await prisma.reviewSession.findUnique({
        where: { id: sessionId },
        include: { items: true },
      }),
      userId,
    );
    const item = session.items.find((x) => x.id === itemId);
    if (!item || item.position !== session.currentIndex)
      throw new ServiceError("Invalid review item", 400);
    if (!item.ratedAt) {
      const review = await prisma.learningReview.findUnique({
        where: {
          userId_vocabularyId: { userId, vocabularyId: item.vocabularyId },
        },
      });
      if (review) {
        const next = reviewSchedule(
          rating,
          review.repetitions,
          review.easeFactor,
        );
        await prisma.$transaction([
          prisma.learningReview.update({
            where: { id: review.id },
            data: {
              ...next,
              dueAt: new Date(Date.now() + next.intervalDays * 86400000),
              lastReviewedAt: new Date(),
            },
          }),
          prisma.reviewSessionItem.update({
            where: { id: itemId },
            data: { rating, ratedAt: new Date() },
          }),
          prisma.reviewLog.create({
            data: { userId, vocabularyId: item.vocabularyId, rating },
          }),
        ]);
      }
      await prisma.reviewSession.update({
        where: { id: sessionId },
        data: {
          currentIndex: Math.min(
            session.currentIndex + 1,
            session.items.length,
          ),
        },
      });
    }
    return this.reviewSession(userId, sessionId);
  }
  async dashboard(userId: number) {
    const [levelSummary, due, user] = await Promise.all([
      this.levels(userId),
      prisma.learningReview.count({
        where: { userId, dueAt: { lte: new Date() } },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { dailyLearningItemGoal: true },
      }),
    ]);
    const learnedToday = await prisma.userVocabulary.count({
      where: {
        userId,
        firstSeenAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });
    return {
      levels: levelSummary,
      due,
      learnedToday,
      goal: user?.dailyLearningItemGoal ?? 10,
      nextAction: due
        ? { type: "review", path: "/learn/review" }
        : { type: "learn", path: "/learn/levels/N5" },
    };
  }
  async goal(userId: number, goal: number) {
    if (![5, 10, 15, 20].includes(goal))
      throw new ServiceError("Goal must be 5, 10, 15 or 20", 400);
    await prisma.user.update({
      where: { id: userId },
      data: { dailyLearningItemGoal: goal },
    });
    return { goal };
  }
}
