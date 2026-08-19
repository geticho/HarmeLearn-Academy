"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  cacheOfflineUser,
  downloadAssessmentForOffline,
  getAssessmentPack,
  getCachedOfflineUser,
  gradeLocally,
  queueSubmission,
  saveAssessmentPack,
  syncQueuedSubmissions,
  type OfflineAssessmentPack,
} from "@/lib/offline-assessments";

interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: string;
  options: unknown;
  orderIndex: number;
}

interface QuizInfo {
  id: string;
  title: string;
  description: string | null;
  courseTitle: string;
  timeLimit: number | null;
  passingScore: number | null;
  totalQuestions: number;
}

interface Feedback {
  given: unknown;
  correct: boolean | null;
  correctAnswer: string;
  explanation: string | null;
}

export default function QuizPage() {
  const params = useParams<{ quizId: string }>();
  const router = useRouter();
  const quizId = params.quizId;

  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    autoGraded: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    passingScore: number | null;
    feedback: Record<string, Feedback>;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [syncNote, setSyncNote] = useState("");
  const packRef = useRef<OfflineAssessmentPack | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Auth: online first, fall back to cached student profile offline.
      let isStudent = false;
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meRes.ok && meData?.user?.role === "student") {
          isStudent = true;
          cacheOfflineUser(meData.user);
        }
      } catch {
        /* offline */
      }
      if (!isStudent) {
        const cached = getCachedOfflineUser<{ role?: string }>();
        if (cached?.role === "student") isStudent = true;
      }
      if (!isStudent) {
        router.push("/login");
        return;
      }

      // Prefer offline pack (includes answers for local grading).
      try {
        const pack = await downloadAssessmentForOffline("quiz", quizId);
        if (cancelled) return;
        packRef.current = pack;
        setSavedOffline(true);
        setOfflineMode(!navigator.onLine);
        setQuiz({
          id: pack.id,
          title: pack.title,
          description: pack.description ?? null,
          courseTitle: pack.courseTitle || "",
          timeLimit: pack.timeLimit ?? null,
          passingScore: pack.passingScore ?? null,
          totalQuestions: pack.totalQuestions,
        });
        setQuestions(
          pack.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            orderIndex: q.orderIndex,
          }))
        );
        if (pack.timeLimit) setSecondsLeft(pack.timeLimit * 60);
        setLoading(false);
        return;
      } catch {
        /* try local pack or online public quiz endpoint */
      }

      const local = getAssessmentPack("quiz", quizId);
      if (local) {
        if (cancelled) return;
        packRef.current = local;
        setSavedOffline(true);
        setOfflineMode(true);
        setQuiz({
          id: local.id,
          title: local.title,
          description: local.description ?? null,
          courseTitle: local.courseTitle || "",
          timeLimit: local.timeLimit ?? null,
          passingScore: local.passingScore ?? null,
          totalQuestions: local.totalQuestions,
        });
        setQuestions(
          local.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            orderIndex: q.orderIndex,
          }))
        );
        if (local.timeLimit) setSecondsLeft(local.timeLimit * 60);
        setLoading(false);
        return;
      }

      // Last resort: online quiz without answers (online-only grading).
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Could not load this quiz.");
          setLoading(false);
          return;
        }
        setQuiz(data.quiz);
        setQuestions(data.questions ?? []);
        if (data.quiz?.timeLimit) setSecondsLeft(data.quiz.timeLimit * 60);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError(
            "You're offline and this quiz was not saved on this device yet. Open it once while online, then it will work offline."
          );
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId, router]);

  // Countdown timer.
  useEffect(() => {
    if (secondsLeft === null || result) return;
    if (secondsLeft <= 0) {
      submit(); // auto-submit on timeout
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, result]);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((id) => answers[id].trim() !== "").length,
    [answers]
  );

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function submit() {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    const payload = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));

    // Offline (or pack available): grade locally immediately.
    const pack =
      packRef.current ||
      getAssessmentPack("quiz", quizId) ||
      null;

    if (!navigator.onLine || pack) {
      if (!pack) {
        setError(
          "Offline grading needs a saved quiz pack. Open this quiz once online first."
        );
        submittedRef.current = false;
        setSubmitting(false);
        return;
      }
      const local = gradeLocally(pack, answers);
      setResult(local);
      setOfflineMode(true);
      queueSubmission({
        kind: "quiz",
        assessmentId: quizId,
        answers: payload,
        localResult: local,
      });
      setSyncNote(
        navigator.onLine
          ? "Graded on device. Syncing to server…"
          : "Graded offline. Will sync when you are back online."
      );
      if (navigator.onLine) {
        const n = await syncQueuedSubmissions();
        if (n > 0) setSyncNote("Saved on device and synced to server.");
      }
      setSubmitting(false);
      return;
    }

    // Online without pack: normal server submit.
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not submit the quiz.");
        submittedRef.current = false;
        return;
      }
      setResult({ ...data.result, feedback: data.feedback ?? {} });
    } catch {
      // Network failed mid-submit — try local pack if any.
      if (pack) {
        const local = gradeLocally(pack, answers);
        setResult(local);
        queueSubmission({
          kind: "quiz",
          assessmentId: quizId,
          answers: payload,
          localResult: local,
        });
        setSyncNote("Network failed. Graded offline and queued for sync.");
      } else {
        setError("Network error — check your connection and try again.");
        submittedRef.current = false;
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function saveForOffline() {
    try {
      const pack = await downloadAssessmentForOffline("quiz", quizId);
      packRef.current = pack;
      saveAssessmentPack(pack);
      setSavedOffline(true);
      setSyncNote("Quiz saved on this device for offline use.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save offline");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading quiz…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold text-slate-900 mb-3">Quiz unavailable</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard/student"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Back to dashboard
            </Link>
            <button
              onClick={() => router.refresh()}
              className="px-5 py-2.5 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- RESULTS ----------
  if (result) {
    const feedbackList = questions.map((q) => ({
      q,
      f: result.feedback[q.id],
    }));

    return (
      <div className="min-h-screen bg-transparent py-10 px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Score card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center">
            <p className="text-sm text-slate-500 uppercase tracking-wide mb-4">
              {quiz?.title}
            </p>
            <div
              className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-black mb-5 ${
                result.passed
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {result.percentage}%
            </div>
            <h1
              className={`text-2xl font-bold mb-2 ${
                result.passed ? "text-green-700" : "text-red-700"
              }`}
            >
              {result.passed ? "🎉 You passed!" : "Keep practising!"}
            </h1>
            <p className="text-slate-600">
              You scored{" "}
              <strong>
                {result.score}/{result.autoGraded}
              </strong>{" "}
              auto-graded questions
              {result.passingScore
                ? ` · pass mark ${result.passingScore}%`
                : ""}
              {result.autoGraded < result.totalQuestions
                ? ` · ${result.totalQuestions - result.autoGraded} essay question(s) sent to your teacher`
                : ""}
            </p>
            {(offlineMode || syncNote) && (
              <p className="mt-3 text-sm text-emerald-300">
                {syncNote || "Completed offline on this device."}
              </p>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <Link
                href="/dashboard/student"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Back to dashboard
              </Link>
              <button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  submittedRef.current = false;
                }}
                className="px-6 py-2.5 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Try again
              </button>
            </div>
          </div>

          {/* Per-question review */}
          <div className="space-y-4">
            {feedbackList.map(({ q, f }, idx) => {
              const given = f?.given === "" || f?.given == null ? "no answer" : String(f.given);
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        f?.correct === null
                          ? "bg-slate-100 text-slate-500"
                          : f?.correct
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {f?.correct === null ? "📝" : f?.correct ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 mb-1">
                        {idx + 1}. {q.questionText}
                      </p>
                      {f?.correct === null ? (
                        <p className="text-sm text-slate-500">
                          {String(given)} — awaiting teacher review
                        </p>
                      ) : (
                        <>
                          <p className={`text-sm ${f?.correct ? "text-green-700" : "text-red-700"}`}>
                            Your answer: {given}
                          </p>
                          {!f?.correct && (
                            <p className="text-sm text-green-700">
                              Correct answer: {f?.correctAnswer}
                            </p>
                          )}
                          {f?.explanation && (
                            <p className="text-sm text-slate-500 mt-2">
                              💡 {f.explanation}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ---------- QUIZ TAKER ----------
  const progress = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-6 sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white/70 text-xs mb-1">{quiz?.courseTitle}</p>
            <h1 className="text-lg sm:text-xl font-bold truncate">{quiz?.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
              {offlineMode && (
                <span className="rounded-full bg-amber-400/20 text-amber-100 px-2 py-0.5">
                  Offline mode
                </span>
              )}
              {savedOffline && (
                <span className="rounded-full bg-emerald-300/20 text-emerald-100 px-2 py-0.5">
                  Saved on device
                </span>
              )}
              {!savedOffline && navigator?.onLine !== false && (
                <button
                  type="button"
                  onClick={saveForOffline}
                  className="rounded-full bg-white/15 text-white px-2 py-0.5 hover:bg-white/25"
                >
                  Save for offline
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {secondsLeft !== null && (
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                <p className="text-[10px] text-white/70 uppercase">Time left</p>
                <p className="font-bold tabular-nums">
                  {Math.floor(secondsLeft / 60)}:
                  {String(secondsLeft % 60).padStart(2, "0")}
                </p>
              </div>
            )}
            <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
              <p className="text-[10px] text-white/70 uppercase">Answered</p>
              <p className="font-bold">
                {answeredCount}/{questions.length}
              </p>
            </div>
          </div>
        </div>
        {/* progress bar */}
        <div className="max-w-3xl mx-auto mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto mt-6 px-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 mt-8 space-y-6">
        {questions.map((q, idx) => {
          const value = answers[q.id] ?? "";
          const isMcq = q.questionType === "multiple_choice";
          const isTf = q.questionType === "true_false";
          const isShort = q.questionType === "short_answer";
          const isEssay = q.questionType === "essay";
          const options: string[] = Array.isArray(q.options) ? q.options : [];

          return (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">
                Question {idx + 1} of {questions.length}
                {isEssay ? " · Essay (teacher-graded)" : ""}
              </p>
              <h2 className="text-lg font-bold text-slate-900 mb-5">{q.questionText}</h2>

              {isMcq && (
                <div className="flex flex-col items-start gap-2">
                  {options.map((opt, oi) => (
                    <label
                      key={`${q.id}-${oi}-${opt}`}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition w-auto max-w-full ${
                        value === opt
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={String(opt)}
                        checked={value === String(opt)}
                        onChange={(e) => setAnswer(q.id, e.target.value)}
                        className="!w-4 !h-4 !min-w-4 !p-0 !m-0 accent-blue-600 shrink-0"
                      />
                      <span className="text-slate-900 text-sm font-medium whitespace-nowrap">
                        <span className="font-bold text-blue-600 mr-1">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {String(opt)}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {isTf && (
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {["True", "False"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(q.id, opt)}
                      className={`px-6 py-4 rounded-xl border-2 font-bold text-sm transition ${
                        value.toLowerCase() === opt.toLowerCase()
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {isShort && (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Type your answer…"
                  className="w-full max-w-md px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              {isEssay && (
                <textarea
                  rows={4}
                  value={value}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Write your essay here…"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          );
        })}

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "✅ Submit quiz"}
          </button>
          <p className="text-sm text-slate-500">
            {answeredCount}/{questions.length} answered · results shown instantly
          </p>
        </div>
      </div>
    </div>
  );
}
