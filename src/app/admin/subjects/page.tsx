"use client";

import { useEffect, useState, type FormEvent } from "react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  gradeFrom: string;
  gradeTo: string;
}

const SUGGESTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "ICT",
  "History",
  "Geography",
  "Civics",
  "Economics",
];

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    icon: "📘",
    color: "#2563eb",
    gradeFrom: "9",
    gradeTo: "12",
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/subjects");
    const data = await res.json();
    setSubjects(data.subjects ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create subject");
        return;
      }
      setMessage(`${form.name} added to the curriculum.`);
      setForm({ ...form, name: "", code: "", description: "" });
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/content/subject/${id}`, {
      method: "DELETE",
    });
    if (res.ok) load();
    else setError("Could not delete this subject (it may still have courses).");
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Subjects</h1>
      <p className="text-slate-600 mt-1 mb-6 max-w-2xl">
        Subjects define the Grade 9–12 curriculum. Only administrators can add or
        remove them; teachers simply deliver courses inside these subjects.
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

      <form
        onSubmit={submit}
        className="bg-white border border-slate-200 rounded-xl p-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
      >
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Subject name *
          </span>
          <input
            required
            list="subject-suggestions"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder="Mathematics"
          />
          <datalist id="subject-suggestions">
            {SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Code *
          </span>
          <input
            required
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="input"
            placeholder="MATH"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Icon
          </span>
          <input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className="input"
            placeholder="🔢"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            From grade
          </span>
          <select
            value={form.gradeFrom}
            onChange={(e) => setForm({ ...form, gradeFrom: e.target.value })}
            className="input"
          >
            {["9", "10", "11", "12"].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            To grade
          </span>
          <select
            value={form.gradeTo}
            onChange={(e) => setForm({ ...form, gradeTo: e.target.value })}
            className="input"
          >
            {["9", "10", "11", "12"].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Colour
          </span>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="input h-[42px] p-1"
          />
        </label>

        <label className="block sm:col-span-2 lg:col-span-3">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Description
          </span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input"
          />
        </label>

        <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add subject"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading subjects…</p>
      ) : subjects.length === 0 ? (
        <p className="text-slate-500">No subjects yet — add the first one above.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex items-start justify-between gap-4"
            >
              <div>
                <p className="text-2xl mb-1">{s.icon || "📘"}</p>
                <p className="font-bold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500 mb-1">
                  {s.code} · Grade {s.gradeFrom}–{s.gradeTo}
                </p>
                {s.description && (
                  <p className="text-sm text-slate-600">{s.description}</p>
                )}
              </div>
              <button
                onClick={() => remove(s.id)}
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
