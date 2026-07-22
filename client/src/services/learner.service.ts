import apiClient from "./api.service";

export interface LessonSummary {
  id: number;
  title: string;
  description: string | null;
  position: number;
  total: number;
  learned: number;
  progress: number;
}
export interface Vocabulary {
  id: number;
  slug: string;
  kanji: string;
  hiragana: string | null;
  romaji: string | null;
  meaningVi: string;
  example: string | null;
  learned?: boolean;
  favorite?: boolean;
  isIntroduced?: boolean;
}

const data = <T>(promise: Promise<{ data: { data: T } }>) =>
  promise.then((response) => response.data.data);
export const learnerApi = {
  levels: () =>
    data<
      Array<{
        level: string;
        lessonCount: number;
        total: number;
        learned: number;
        progress: number;
      }>
    >(apiClient.get("/learner/levels")),
  lessons: (level: string) =>
    data<LessonSummary[]>(apiClient.get(`/learner/levels/${level}/lessons`)),
  lesson: (id: number) =>
    data<{
      id: number;
      level: string;
      title: string;
      description: string | null;
      total: number;
      learned: number;
      vocabularies: Vocabulary[];
    }>(apiClient.get(`/learner/lessons/${id}`)),
  startFlashcards: (lessonId: number) =>
    data<any>(
      apiClient.post(`/learner/lessons/${lessonId}/flashcard-sessions`),
    ),
  flashcard: (id: number) =>
    data<any>(apiClient.get(`/learner/flashcard-sessions/${id}`)),
  reveal: (sessionId: number, itemId: number) =>
    data<any>(
      apiClient.put(`/learner/flashcard-sessions/${sessionId}/items/${itemId}`),
    ),
  completeFlashcards: (id: number) =>
    data<any>(apiClient.post(`/learner/flashcard-sessions/${id}/complete`)),
  reviewSummary: () =>
    data<{ due: number }>(apiClient.get("/learner/reviews/summary")),
  startReview: () => data<any>(apiClient.post("/learner/reviews/sessions", {})),
  reviewSession: (id: number) =>
    data<any>(apiClient.get(`/learner/reviews/sessions/${id}`)),
  rateReview: (sessionId: number, itemId: number, rating: number) =>
    data<any>(
      apiClient.post(
        `/learner/reviews/sessions/${sessionId}/items/${itemId}/rating`,
        { rating },
      ),
    ),
  dashboard: () => data<any>(apiClient.get("/learner/dashboard")),
  goal: (goal: number) =>
    data<{ goal: number }>(
      apiClient.put("/learner/preferences/goal", { goal }),
    ),
};
