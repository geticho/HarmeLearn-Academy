"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useCatalog } from "@/components/admin/useCatalog";

interface QuestionRow {
  id: string;
  quizId: string;
  questionText: string;
  questionType: string;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
  orderIndex: number;
  quizTitle: string | null;
}

const TYPES = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short answer" },
  { value: "essay", label: "Essay (manually graded)" },
];

export default function AdminQuestionsPage() {
  const { catalog, loading: catalogLoading, reload } = useCatalog();
  const [quizId, setQuizId] = useState("");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    questionType: "multiple_choice",
    questionText: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
  });

  const loadQuestions = useCallback(async () => {
    const url = quizId
      ? `/api/admin/questions?quizId=${quizId}`
      : "/api/admin/questions";
    const res = await fetch(url);
    const data = await res.json();
    setQuestions(res.ok ? data.questions ?? [] : []);
  }, [quizId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function setOption(index: number, value: string) {
    const next = [...form.options];
    next[index] = value;
    setForm({ ...form, options: next });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!quizId) {
      setError("Choose the quiz this question belongs to.");
      return;
    }

    const payload: Record<string, unknown> = {
      quizId,
      questionText: form.questionText,
      questionType: form.questionType,
      correctAnswer: form.correctAnswer,
      explanation: form.explanation || undefined,
    };
    if (form.questionType === "multiple_choice") {
      payload.options = form.options.filter((o) => o.trim());
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not add question");
        return;
      }
      setMessage("Question added to the bank.");
      setForm({
        questionType: form.questionType,
        questionText: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      });
      loadQuestions();
      reload();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/content/question/${id}`, { method: "DELETE" });
    loadQuestions();
  }

  const noQuizzes = !catalogLoading && catalog.quizzes.length === 0;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        Question Bank
      </h1>
      <p className="text-slate-600 mt-1 mb-6 max-w-2xl">
        Exam and quiz questions are authored by administrators only. Choose a
        quiz, pick the question type, and the platform will auto-grade everything
        except essays.
      </p>

      {noQuizzes && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          No quizzes exist yet. Create one under <strong>Curriculum → Quiz</strong>{" "}
          first.
        </div>
      )}
      {message && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 max-w-md">
        <span className="block text-sm font-medium text-slate-700 mb-1.5">
          Quiz
        </span>
        <select
          value={quizId}
          onChange={(e) => setQuizId(e.target.value)}
          className="input"
        >
          <option value="">All questions</option>
          {catalog.quizzes.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title} ({q.totalQuestions ?? 0} questions)
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-8 grid gap-6 mb-10 max-w-3xl"
      >
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Question type
          </span>
          <select
            value={form.questionType}
            onChange={(e) =>
              setForm({ ...form, questionType: e.target.value, correctAnswer: "" })
            }
            className="input"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Question *
          </span>
          <textarea
            required
            rows={2}
            value={form.questionText}
            onChange={(e) => setForm({ ...form, questionText: e.target.value })}
            className="input"
            placeholder="What is the value of x in 2x + 4 = 10?"
          />
        </label>

        {form.questionType === "multiple_choice" && (
          <div className="grid sm:grid-cols-2 gap-3">
            {form.options.map((opt, i) => (
              <label key={i} className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1.5">
                  Option {String.fromCharCode(65 + i)}
                </span>
                <input
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                  className="input"
                />
              </label>
            ))}
          </div>
        )}

        {form.questionType === "true_false" ? (
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              Correct answer *
            </span>
            <select
              required
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              className="input"
            >
              <option value="">Select…</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </label>
        ) : form.questionType === "multiple_choice" ? (
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              Correct answer * (must match an option exactly)
            </span>
            <select
              required
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              className="input"
            >
              <option value="">Select…</option>
              {form.options
                .filter((o) => o.trim())
                .map((o, i) => (
                  <option key={i} value={o}>
                    {o}
                  </option>
                ))}
            </select>
          </label>
        ) : form.questionType === "short_answer" ? (
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              Model answer *
            </span>
            <input
              required
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              className="input"
            />
          </label>
        ) : (
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              Marking guidance
            </span>
            <textarea
              rows={2}
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              className="input"
              placeholder="Key points the examiner should look for…"
            />
          </label>
        )}

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Explanation shown after grading
          </span>
          <textarea
            rows={2}
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            className="input"
          />
        </label>

        <div className="flex justify-end">
          <button
            disabled={saving || noQuizzes}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add question"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <p className="text-slate-500">No questions yet.</p>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {q.questionType.replace("_", " ")}
                  </span>
                  {q.quizTitle && (
                    <span className="text-xs text-slate-500">{q.quizTitle}</span>
                  )}
                </div>
                <p className="font-medium text-slate-900">
                  {q.orderIndex}. {q.questionText}
                </p>
                {Array.isArray(q.options) && (
                  <ul className="mt-1 text-sm text-slate-600 list-disc list-inside">
                    {(q.options as string[]).map((o, i) => (
                      <li
                        key={i}
                        className={o === q.correctAnswer ? "text-green-700 font-medium" : ""}
                      >
                        {o}
                      </li>
                    ))}
                  </ul>
                )}
                {!Array.isArray(q.options) && q.correctAnswer && (
                  <p className="mt-1 text-sm text-green-700">
                    Answer: {q.correctAnswer}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(q.id)}
                className="text-sm text-red-600 hover:underline shrink-0"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
