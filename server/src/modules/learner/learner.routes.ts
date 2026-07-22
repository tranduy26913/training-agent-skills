import { Router } from "express";
import { authMiddleware } from "@middleware/auth.middleware";
import { asyncHandler } from "@middleware/async-handler.middleware";
import { LearnerController } from "./learner.controller";

const router = Router();
const controller = new LearnerController();
router.use(authMiddleware);

router.get("/levels", asyncHandler(controller.levels.bind(controller)));
router.get(
  "/levels/:level/lessons",
  asyncHandler(controller.lessons.bind(controller)),
);
router.get("/lessons/:id", asyncHandler(controller.lesson.bind(controller)));
router.get(
  "/vocabularies/:slug",
  asyncHandler(controller.vocabulary.bind(controller)),
);
router.put(
  "/vocabularies/:id/favorite",
  asyncHandler(controller.favorite.bind(controller)),
);
router.post(
  "/lessons/:id/flashcard-sessions",
  asyncHandler(controller.startFlashcards.bind(controller)),
);
router.get(
  "/flashcard-sessions/:id",
  asyncHandler(controller.flashcardSession.bind(controller)),
);
router.put(
  "/flashcard-sessions/:id/items/:itemId",
  asyncHandler(controller.reveal.bind(controller)),
);
router.post(
  "/flashcard-sessions/:id/complete",
  asyncHandler(controller.completeFlashcards.bind(controller)),
);
router.post(
  "/lessons/:id/quiz-attempts",
  asyncHandler(controller.startQuiz.bind(controller)),
);
router.get(
  "/quiz-attempts/:id",
  asyncHandler(controller.quiz.bind(controller)),
);
router.put(
  "/quiz-attempts/:id/answers/:vocabularyId",
  asyncHandler(controller.answerQuiz.bind(controller)),
);
router.post(
  "/quiz-attempts/:id/submit",
  asyncHandler(controller.submitQuiz.bind(controller)),
);
router.get(
  "/reviews/summary",
  asyncHandler(controller.reviewSummary.bind(controller)),
);
router.post(
  "/reviews/sessions",
  asyncHandler(controller.startReview.bind(controller)),
);
router.get(
  "/reviews/sessions/:id",
  asyncHandler(controller.reviewSession.bind(controller)),
);
router.post(
  "/reviews/sessions/:id/items/:itemId/rating",
  asyncHandler(controller.rateReview.bind(controller)),
);
router.get("/dashboard", asyncHandler(controller.dashboard.bind(controller)));
router.put("/preferences/goal", asyncHandler(controller.goal.bind(controller)));

export const learnerRoutes = router;
