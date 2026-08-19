"use client";

import { useState, type FormEvent } from "react";
import { useCatalog } from "@/components/admin/useCatalog";

type Step = "course" | "unit" | "lesson" | "quiz";

export default function AdminCurriculumPage() {
  const { catalog, loading, reload } = useCatalog();
  const [tab, setTab] = useState<Step>("course");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [course, setCourse] = useState({
    title: "",
    description: "",
    subjectId: "",
    grade: "9",
    teacherId: "",
    isPublished: true,
  });
  const [unit, setUnit] = useState({ courseId: "", title: "", description: "" });
  const [lesson, setLesson] = useState({
    unitId: "",
    title: "",
    description: "",
    durationMinutes: "",
  });
  const [quiz, setQuiz] = useState({
    lessonId: "",
    title: "",
    passingScore: "60",
    timeLimit: "",
  });

  async function post(type: Step, payload: Record<string, unknown>) {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        return false;
      }
      setMessage(data.message);
      reload();
      return true;
    } finally {
      setSaving(false);
    }
  }

  const unitsForCourse = (courseId: string) =>
    catalog.units.filter((u) => u.courseId === courseId);

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Curriculum</h1>
      <p className="text-slate-600 mt-1 mb-6 max-w-2xl">
        Build the structure content hangs off:{" "}
        <strong>Course → Unit → Lesson → Quiz</strong>. Only administrators can
        create these. Once a lesson exists you can attach videos, PDFs and
        questions to it.
      </p>

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

      <div className="flex flex-wrap gap-3 mb-8">
        {(["course", "unit", "lesson", "quiz"] as Step[]).map((s, i) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition ${
              tab === s
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 max-w-3xl">
          {tab === "course" && (
            <form
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                if (await post("course", course))
                  setCourse({ ...course, title: "", description: "" });
              }}
              className="grid sm:grid-cols-2 gap-4"
            >
              <L label="Course title *">
                <input
                  required
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  className="input"
                  placeholder="Mathematics Grade 9"
                />
              </L>
              <L label="Grade *">
                <select
                  value={course.grade}
                  onChange={(e) => setCourse({ ...course, grade: e.target.value })}
                  className="input"
                >
                  {["9", "10", "11", "12"].map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
                </select>
              </L>
              <L label="Subject *">
                <select
                  required
                  value={course.subjectId}
                  onChange={(e) =>
                    setCourse({ ...course, subjectId: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select subject…</option>
                  {catalog.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {catalog.subjects.length === 0 && (
                  <span className="text-xs text-amber-600">
                    Add a subject first.
                  </span>
                )}
              </L>
              <L label="Assign teacher *">
                <select
                  required
                  value={course.teacherId}
                  onChange={(e) =>
                    setCourse({ ...course, teacherId: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select teacher…</option>
                  {catalog.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                      {t.specialization ? ` — ${t.specialization}` : ""}
                    </option>
                  ))}
                </select>
                {catalog.teachers.length === 0 && (
                  <span className="text-xs text-amber-600">
                    Create a teacher account first.
                  </span>
                )}
              </L>
              <L label="Description" full>
                <textarea
                  rows={3}
                  value={course.description}
                  onChange={(e) =>
                    setCourse({ ...course, description: e.target.value })
                  }
                  className="input"
                />
              </L>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={course.isPublished}
                  onChange={(e) =>
                    setCourse({ ...course, isPublished: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                Publish immediately (visible to students)
              </label>
              <Submit saving={saving} label="Create course" />
            </form>
          )}

          {tab === "unit" && (
            <form
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                if (await post("unit", unit)) setUnit({ ...unit, title: "", description: "" });
              }}
              className="grid sm:grid-cols-2 gap-4"
            >
              <L label="Course *" full>
                <select
                  required
                  value={unit.courseId}
                  onChange={(e) => setUnit({ ...unit, courseId: e.target.value })}
                  className="input"
                >
                  <option value="">Select course…</option>
                  {catalog.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} (Grade {c.grade})
                    </option>
                  ))}
                </select>
              </L>
              <L label="Unit title *" full>
                <input
                  required
                  value={unit.title}
                  onChange={(e) => setUnit({ ...unit, title: e.target.value })}
                  className="input"
                  placeholder="Unit 1: Number Systems"
                />
              </L>
              <L label="Description" full>
                <textarea
                  rows={2}
                  value={unit.description}
                  onChange={(e) => setUnit({ ...unit, description: e.target.value })}
                  className="input"
                />
              </L>
              <Submit saving={saving} label="Create unit" />
            </form>
          )}

          {tab === "lesson" && (
            <form
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                if (await post("lesson", lesson))
                  setLesson({ ...lesson, title: "", description: "" });
              }}
              className="grid sm:grid-cols-2 gap-4"
            >
              <L label="Unit *" full>
                <select
                  required
                  value={lesson.unitId}
                  onChange={(e) => setLesson({ ...lesson, unitId: e.target.value })}
                  className="input"
                >
                  <option value="">Select unit…</option>
                  {catalog.courses.map((c) => (
                    <optgroup key={c.id} label={`${c.title} (Grade ${c.grade})`}>
                      {unitsForCourse(c.id).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </L>
              <L label="Lesson title *">
                <input
                  required
                  value={lesson.title}
                  onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                  className="input"
                  placeholder="Lesson 1: Rational numbers"
                />
              </L>
              <L label="Duration (minutes)">
                <input
                  type="number"
                  min="1"
                  value={lesson.durationMinutes}
                  onChange={(e) =>
                    setLesson({ ...lesson, durationMinutes: e.target.value })
                  }
                  className="input"
                />
              </L>
              <L label="Description / notes" full>
                <textarea
                  rows={3}
                  value={lesson.description}
                  onChange={(e) =>
                    setLesson({ ...lesson, description: e.target.value })
                  }
                  className="input"
                />
              </L>
              <Submit saving={saving} label="Create lesson" />
            </form>
          )}

          {tab === "quiz" && (
            <form
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                if (await post("quiz", quiz)) setQuiz({ ...quiz, title: "" });
              }}
              className="grid sm:grid-cols-2 gap-4"
            >
              <L label="Lesson *" full>
                <select
                  required
                  value={quiz.lessonId}
                  onChange={(e) => setQuiz({ ...quiz, lessonId: e.target.value })}
                  className="input"
                >
                  <option value="">Select lesson…</option>
                  {catalog.lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </L>
              <L label="Quiz title *">
                <input
                  required
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  className="input"
                  placeholder="Unit 1 check-up"
                />
              </L>
              <L label="Passing score (%)">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quiz.passingScore}
                  onChange={(e) => setQuiz({ ...quiz, passingScore: e.target.value })}
                  className="input"
                />
              </L>
              <L label="Time limit (minutes)">
                <input
                  type="number"
                  min="1"
                  value={quiz.timeLimit}
                  onChange={(e) => setQuiz({ ...quiz, timeLimit: e.target.value })}
                  className="input"
                  placeholder="No limit"
                />
              </L>
              <Submit saving={saving} label="Create quiz" />
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function L({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Submit({ saving, label }: { saving: boolean; label: string }) {
  return (
    <div className="sm:col-span-2 flex justify-end">
      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
      >
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}
