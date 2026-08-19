"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useCatalog } from "@/components/admin/useCatalog";

interface PastExamRow {
  id: string;
  title: string;
  grade: string;
  year: number | null;
  description: string | null;
  fileUrl: string;
  isPublished: boolean | null;
  subjectId: string;
  subjectName: string | null;
}

export default function AdminPastExamsPage() {
  const { catalog, loading: catalogLoading } = useCatalog();
  const [exams, setExams] = useState<PastExamRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    subjectId: "",
    grade: "9",
    title: "",
    year: "",
    fileUrl: "",
    description: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/past-exams");
    const data = await res.json();
    setExams(res.ok ? data.exams ?? [] : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/past-exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not add past exam");
      setMessage("Past exam added — students can now see it under this subject.");
      setForm({ ...form, title: "", year: "", fileUrl: "", description: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/content/past_exam/${id}`, { method: "DELETE" });
    load();
  }

  const noSubjects = !catalogLoading && catalog.subjects.length === 0;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Past Exams</h1>
      <p className="text-slate-600 mt-1 mb-6 max-w-2xl">
        Upload past national &amp; school exam papers (PDFs) per subject and
        grade. Students find them on their dashboard under each subject&apos;s{" "}
        <strong>Past Exams</strong> tab.
      </p>

      {noSubjects && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          Create subjects first — past exams are attached to a subject.
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

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-8 grid sm:grid-cols-2 gap-6 mb-10 max-w-3xl"
      >
        <F label="Subject *">
          <select
            required
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            className="input"
          >
            <option value="">Select subject…</option>
            {catalog.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </F>
        <F label="Grade *">
          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="input"
          >
            {["9", "10", "11", "12"].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </F>
        <F label="Exam title *">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input"
            placeholder="Ethiopian National Exam — Mathematics"
          />
        </F>
        <F label="Year">
          <input
            type="number"
            min="1990"
            max="2100"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="input"
            placeholder="2024"
          />
        </F>
        <F label="Exam paper URL *" full>
          <input
            required
            type="url"
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            className="input"
            placeholder="https://…/grade9-math-2024.pdf"
          />
        </F>
        <F label="Description" full>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input"
            placeholder="Full exam with answer key, 2 hours, 50 questions"
          />
        </F>
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add past exam"}
          </button>
        </div>
      </form>

      {exams.length === 0 ? (
        <p className="text-slate-500">No past exams yet — add the first one above.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((e) => (
            <div
              key={e.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-2xl mb-2">📋</p>
                <p className="font-bold text-slate-900 text-sm leading-snug">
                  {e.title}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                    {e.subjectName ?? "—"}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    Grade {e.grade}
                  </span>
                  {e.year && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                      {e.year}
                    </span>
                  )}
                </div>
                {e.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {e.description}
                  </p>
                )}
                <a
                  href={e.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 text-sm text-blue-600 hover:underline font-semibold"
                >
                  Open paper ↗
                </a>
              </div>
              <button
                onClick={() => remove(e.id)}
                className="text-sm text-red-600 hover:underline shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function F({
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
