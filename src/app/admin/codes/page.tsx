"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

interface CodeRow {
  id: string;
  code: string;
  role: string;
  grade: string | null;
  maxUses: number;
  usedCount: number;
  isActive: boolean | null;
  expiresAt: string | null;
  createdAt: string | null;
  createdByFirst: string | null;
  createdByLast: string | null;
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [newCode, setNewCode] = useState<CodeRow | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    role: "student",
    grade: "",
    maxUses: "50",
    expiresInDays: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/codes");
    const data = await res.json();
    setCodes(res.ok ? data.codes ?? [] : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNewCode(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Could not create code");
      setNewCode(data.code);
      setCopied(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(code: CodeRow) {
    await fetch(`/api/admin/codes/${code.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !code.isActive }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/codes/${id}`, { method: "DELETE" });
    load();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
        Registration Codes
      </h1>
      <p className="text-slate-600 mt-2 mb-8 max-w-2xl leading-relaxed">
        Students and teachers need a code to create an account. Generate codes
        here and share them with your school. You can restrict a code to a
        specific role and grade, set a usage limit, or let it expire.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Generate form */}
      <form
        onSubmit={generate}
        className="bg-white border border-slate-200 rounded-xl p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 max-w-4xl"
      >
        <F label="For *">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="input"
          >
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
          </select>
        </F>
        <F label="Grade (students only)">
          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="input"
          >
            <option value="">Any grade</option>
            {["9", "10", "11", "12"].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </F>
        <F label="Max uses">
          <input
            type="number"
            min="1"
            max="10000"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            className="input"
          />
        </F>
        <F label="Expires in (days)">
          <input
            type="number"
            min="0"
            value={form.expiresInDays}
            onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })}
            className="input"
            placeholder="Never"
          />
        </F>
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? "Generating…" : "🔑 Generate code"}
          </button>
        </div>
      </form>

      {/* Freshly generated code */}
      {newCode && (
        <div className="mb-8 bg-green-50 border-2 border-green-300 rounded-2xl p-8 text-center">
          <p className="text-sm font-medium text-green-800 mb-2">
            Share this code with your{" "}
            {newCode.role === "teacher" ? "teachers" : "students"}:
          </p>
          <p className="text-4xl font-black tracking-[0.25em] text-green-900 font-mono mb-4">
            {newCode.code}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => copy(newCode.code)}
              className="px-5 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
            >
              {copied ? "✓ Copied!" : "Copy code"}
            </button>
            <button
              onClick={() => setNewCode(null)}
              className="px-5 py-2 border border-green-300 text-green-800 rounded-lg font-semibold hover:bg-green-100 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Code list */}
      {codes.length === 0 ? (
        <p className="text-slate-500">No codes yet — generate your first one above.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-left">
                <tr>
                  <th className="px-6 py-4 font-semibold">Code</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Grade</th>
                  <th className="px-6 py-4 font-semibold">Uses</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const expired =
                    c.expiresAt && new Date(c.expiresAt) < new Date();
                  return (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-900">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 capitalize">{c.role}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {c.grade ? `Grade ${c.grade}` : "Any"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {c.usedCount}/{c.maxUses}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            expired
                              ? "bg-red-100 text-red-700"
                              : c.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {expired ? "Expired" : c.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 justify-end whitespace-nowrap">
                          <button
                            onClick={() => copy(c.code)}
                            className="text-blue-600 hover:underline"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => toggle(c)}
                            className="text-amber-600 hover:underline"
                          >
                            {c.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => remove(c.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
