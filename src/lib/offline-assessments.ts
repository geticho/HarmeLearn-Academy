/**
 * Offline support for quizzes and past exams.
 *
 * - Saves full assessment packs (questions + answers) on device
 * - Grades attempts locally when offline
 * - Queues server submissions and syncs when back online
 */

export type AssessmentKind = "quiz" | "exam";

export interface OfflineQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options: unknown;
  orderIndex: number;
  correctAnswer: string;
  explanation: string | null;
}

export interface OfflineAssessmentPack {
  kind: AssessmentKind;
  id: string;
  title: string;
  description?: string | null;
  courseTitle?: string | null;
  year?: number | null;
  fileUrl?: string | null;
  timeLimit?: number | null;
  passingScore?: number | null;
  totalQuestions: number;
  questions: OfflineQuestion[];
  savedAt: string;
}

export interface LocalGradeResult {
  score: number;
  autoGraded: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passingScore: number | null;
  feedback: Record<
    string,
    {
      given: unknown;
      correct: boolean | null;
      correctAnswer: string;
      explanation: string | null;
    }
  >;
  offline: true;
  synced?: boolean;
}

export interface QueuedSubmission {
  id: string;
  kind: AssessmentKind;
  assessmentId: string;
  answers: { questionId: string; answer: string }[];
  localResult: LocalGradeResult;
  createdAt: string;
}

const PACK_PREFIX = "hl_offline_pack_";
const QUEUE_KEY = "hl_offline_submission_queue";
const USER_KEY = "hl_offline_user";

function packKey(kind: AssessmentKind, id: string) {
  return `${PACK_PREFIX}${kind}_${id}`;
}

export function cacheOfflineUser(user: unknown) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

export function getCachedOfflineUser<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveAssessmentPack(pack: OfflineAssessmentPack) {
  try {
    localStorage.setItem(packKey(pack.kind, pack.id), JSON.stringify(pack));
  } catch {
    /* storage full / unavailable */
  }
}

export function getAssessmentPack(
  kind: AssessmentKind,
  id: string
): OfflineAssessmentPack | null {
  try {
    const raw = localStorage.getItem(packKey(kind, id));
    return raw ? (JSON.parse(raw) as OfflineAssessmentPack) : null;
  } catch {
    return null;
  }
}

export function listSavedAssessmentPacks(): OfflineAssessmentPack[] {
  const packs: OfflineAssessmentPack[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PACK_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      packs.push(JSON.parse(raw) as OfflineAssessmentPack);
    }
  } catch {
    /* ignore */
  }
  return packs.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

/** Grade an attempt entirely on-device using a saved pack. */
export function gradeLocally(
  pack: OfflineAssessmentPack,
  answers: Record<string, string>
): LocalGradeResult {
  let score = 0;
  let autoGraded = 0;
  const feedback: LocalGradeResult["feedback"] = {};
  const passingScore = pack.passingScore ?? (pack.kind === "exam" ? 50 : 60);

  for (const q of pack.questions) {
    const given = answers[q.id] ?? "";
    if (q.questionType === "essay") {
      feedback[q.id] = {
        given,
        correct: null,
        correctAnswer: "",
        explanation: "Essay — will be reviewed when you sync online.",
      };
      continue;
    }

    autoGraded++;
    const isCorrect = normalize(given) === normalize(q.correctAnswer);
    if (isCorrect) score++;
    feedback[q.id] = {
      given,
      correct: isCorrect,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    };
  }

  const percentage =
    autoGraded === 0 ? 0 : Math.round((score / autoGraded) * 100);

  return {
    score,
    autoGraded,
    totalQuestions: pack.questions.length,
    percentage,
    passed: percentage >= passingScore,
    passingScore,
    feedback,
    offline: true,
    synced: false,
  };
}

export function getSubmissionQueue(): QueuedSubmission[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSubmission[]) : [];
  } catch {
    return [];
  }
}

function saveSubmissionQueue(queue: QueuedSubmission[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function queueSubmission(
  item: Omit<QueuedSubmission, "id" | "createdAt">
): QueuedSubmission {
  const entry: QueuedSubmission = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const queue = getSubmissionQueue();
  queue.push(entry);
  saveSubmissionQueue(queue);
  return entry;
}

/**
 * Push any queued offline submissions to the server.
 * Returns how many were synced successfully.
 */
export async function syncQueuedSubmissions(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;

  const queue = getSubmissionQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedSubmission[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const url =
        item.kind === "quiz"
          ? `/api/quizzes/${item.assessmentId}/submit`
          : `/api/past-exams/${item.assessmentId}/submit`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: item.answers }),
      });
      if (res.ok) {
        synced++;
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  saveSubmissionQueue(remaining);
  return synced;
}

/** Download and cache a quiz/exam pack for offline use. */
export async function downloadAssessmentForOffline(
  kind: AssessmentKind,
  id: string
): Promise<OfflineAssessmentPack> {
  const url =
    kind === "quiz"
      ? `/api/quizzes/${id}/offline-pack`
      : `/api/past-exams/${id}/offline-pack`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Could not download for offline");
  }
  const pack = data.pack as OfflineAssessmentPack;
  saveAssessmentPack(pack);
  return pack;
}
