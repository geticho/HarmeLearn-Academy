"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  grade: string | null;
  stream: string | null;
  enrollmentNumber: string | null;
  specialization: string | null;
  employeeId: string | null;
}

export default function UserManager({
  role,
  heading,
  blurb,
}: {
  role: "student" | "teacher";
  heading: string;
  blurb: string;
}) {
  const [rows, setRows] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; password?: string } | null>(
    null
  );

  const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    grade: "9",
    stream: "",
    enrollmentNumber: "",
    parentEmail: "",
    specialization: "",
    employeeId: "",
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setRows(res.ok ? data.users ?? [] : []);
    } finally {
      setLoading(false);
    }
  }, [role, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice(null);
    setSaving(true);

    const payload: Record<string, unknown> = {
      role,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password || undefined,
    };

    if (role === "student") {
      payload.grade = form.grade;
      payload.stream = form.stream || undefined;
      payload.enrollmentNumber = form.enrollmentNumber || undefined;
      payload.parentEmail = form.parentEmail || undefined;
    } else {
      payload.specialization = form.specialization || undefined;
      payload.employeeId = form.employeeId || undefined;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.details?.join(" ") || data.error || "Could not create user");
        return;
      }

      setNotice({
        text: `${form.firstName} ${form.lastName} was added.`,
        password: data.temporaryPassword,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    load();
  }

  async function resetPassword(user: ManagedUser) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPassword: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setNotice({
        text: `New password generated for ${user.firstName} ${user.lastName}.`,
        password: data.temporaryPassword,
      });
    } else {
      setError(data.error || "Could not reset password");
    }
  }

  async function remove(user: ManagedUser) {
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      setNotice({ text: `${user.firstName} ${user.lastName} was removed.` });
      load();
    } else {
      const data = await res.json();
      setError(data.error || "Could not delete user");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{heading}</h1>
          <p className="text-slate-600 mt-2 max-w-2xl leading-relaxed">{blurb}</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setError("");
          }}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {showForm ? "Cancel" : `+ Add ${role}`}
        </button>
      </div>

      {notice && (
        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-800 font-medium">{notice.text}</p>
          {notice.password && (
            <p className="mt-2 text-sm text-green-900">
              Temporary password:{" "}
              <code className="px-2 py-1 bg-white border border-green-300 rounded font-mono">
                {notice.password}
              </code>{" "}
              — share it with the user, it is shown only once.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={createUser}
          className="mb-10 bg-white border border-slate-200 rounded-xl p-8 grid sm:grid-cols-2 gap-6"
        >
          <Field label="First name *">
            <input
              required
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Last name *">
            <input
              required
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Email *">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="input"
              placeholder="+251..."
            />
          </Field>

          {role === "student" ? (
            <>
              <Field label="Grade *">
                <select
                  value={form.grade}
                  onChange={(e) => update("grade", e.target.value)}
                  className="input"
                >
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </Field>
              <Field label="Stream">
                <select
                  value={form.stream}
                  onChange={(e) => update("stream", e.target.value)}
                  className="input"
                >
                  <option value="">Not applicable</option>
                  <option value="natural">Natural Science</option>
                  <option value="social">Social Science</option>
                </select>
              </Field>
              <Field label="Enrollment number">
                <input
                  value={form.enrollmentNumber}
                  onChange={(e) => update("enrollmentNumber", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Parent email">
                <input
                  type="email"
                  value={form.parentEmail}
                  onChange={(e) => update("parentEmail", e.target.value)}
                  className="input"
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Specialization">
                <input
                  value={form.specialization}
                  onChange={(e) => update("specialization", e.target.value)}
                  className="input"
                  placeholder="Mathematics"
                />
              </Field>
              <Field label="Employee ID">
                <input
                  value={form.employeeId}
                  onChange={(e) => update("employeeId", e.target.value)}
                  className="input"
                />
              </Field>
            </>
          )}

          <Field label="Password (leave blank to auto-generate)">
            <input
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input"
              placeholder="Auto-generated"
            />
          </Field>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input max-w-md"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-left">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">
                  {role === "student" ? "Grade" : "Specialization"}
                </th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No {role} accounts yet. Use “Add {role}” to create the first one.
                  </td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {role === "student"
                        ? u.grade
                          ? `Grade ${u.grade}${u.stream ? ` · ${u.stream}` : ""}`
                          : "—"
                        : u.specialization || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 justify-end whitespace-nowrap">
                        <button
                          onClick={() => resetPassword(u)}
                          className="text-blue-600 hover:underline"
                        >
                          Reset password
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className="text-amber-600 hover:underline"
                        >
                          {u.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => remove(u)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
