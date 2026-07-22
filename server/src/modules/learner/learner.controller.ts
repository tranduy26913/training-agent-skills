import type { Response } from "express";
import { getAuthUserId } from "@utils/auth.util";
import { sendSuccess } from "@utils/response.util";
import { ServiceError } from "@models/common.model";
import type { AuthenticatedRequest } from "@types-express";
import { LearnerService } from "./learner.service";

const service = new LearnerService();
const userIdOf = (req: AuthenticatedRequest) => {
  const id = getAuthUserId(req);
  if (!id) throw new ServiceError("Not authenticated", 401);
  return id;
};
const idOf = (value: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1)
    throw new ServiceError("Invalid identifier", 400);
  return id;
};

export class LearnerController {
  async levels(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, { data: await service.levels(userIdOf(req)) });
  }
  async lessons(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.lessons(userIdOf(req), req.params.level),
    });
  }
  async lesson(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.lesson(userIdOf(req), idOf(req.params.id)),
    });
  }
  async vocabulary(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.vocabulary(userIdOf(req), req.params.slug),
    });
  }
  async favorite(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.favorite(
        userIdOf(req),
        idOf(req.params.id),
        Boolean(req.body?.isFavorite),
      ),
    });
  }
  async startFlashcards(req: AuthenticatedRequest, res: Response) {
    sendSuccess(
      res,
      {
        data: await service.startFlashcards(userIdOf(req), idOf(req.params.id)),
      },
      201,
    );
  }
  async flashcardSession(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.flashcardSession(userIdOf(req), idOf(req.params.id)),
    });
  }
  async reveal(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.reveal(
        userIdOf(req),
        idOf(req.params.id),
        idOf(req.params.itemId),
      ),
    });
  }
  async completeFlashcards(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.completeFlashcards(
        userIdOf(req),
        idOf(req.params.id),
      ),
    });
  }
  async startQuiz(req: AuthenticatedRequest, res: Response) {
    sendSuccess(
      res,
      { data: await service.startQuiz(userIdOf(req), idOf(req.params.id)) },
      201,
    );
  }
  async quiz(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.quiz(userIdOf(req), idOf(req.params.id)),
    });
  }
  async answerQuiz(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.answerQuiz(
        userIdOf(req),
        idOf(req.params.id),
        idOf(req.params.vocabularyId),
        String(req.body?.answer ?? ""),
      ),
    });
  }
  async submitQuiz(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.submitQuiz(userIdOf(req), idOf(req.params.id)),
    });
  }
  async reviewSummary(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, { data: await service.reviewSummary(userIdOf(req)) });
  }
  async startReview(req: AuthenticatedRequest, res: Response) {
    sendSuccess(
      res,
      {
        data: await service.startReview(
          userIdOf(req),
          req.body?.level,
          req.body?.lessonId,
        ),
      },
      201,
    );
  }
  async reviewSession(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.reviewSession(userIdOf(req), idOf(req.params.id)),
    });
  }
  async rateReview(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.rateReview(
        userIdOf(req),
        idOf(req.params.id),
        idOf(req.params.itemId),
        Number(req.body?.rating),
      ),
    });
  }
  async dashboard(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, { data: await service.dashboard(userIdOf(req)) });
  }
  async goal(req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, {
      data: await service.goal(userIdOf(req), Number(req.body?.goal)),
    });
  }
}
