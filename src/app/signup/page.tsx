"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import ClearDataButton from "@/components/ClearDataButton";
import BrandLogo from "@/components/BrandLogo";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    role: "student",
    registrationCode: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    grade: "9",
    stream: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: form.role,
          registrationCode: form.registrationCode,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          grade: form.grade,
          stream: form.stream || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.details?.join(" ") || data.error || "Registration failed");
        return;
      }

      // Signed in automatically — go straight to the right dashboard.
      router.push(form.role === "teacher" ? "/dashboard/teacher" : "/dashboard/student");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent py-16 px-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 sm:p-12 border border-slate-200">
        <div className="flex justify-center mb-6">
          <BrandLogo size={48} />
        </div>

        <h1 className="text-3xl font-bold text-center mb-3 text-slate-900">
          Create your account
        </h1>
        <p className="text-center text-slate-600 mb-10">
          Join thousands of Ethiopian students learning on HarmeLearn
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-4">
            {(["student", "teacher"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => update("role", r)}
                className={`px-4 py-3 rounded-xl border-2 font-semibold capitalize transition ${
                  form.role === r
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {r === "student" ? "👨‍🎓 I'm a Student" : "👨‍🏫 I'm a Teacher"}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-2">
              Registration code *{" "}
              <span className="text-xs text-slate-400 font-normal">
                (ask your school administrator for the code)
              </span>
            </span>
            <input
              required
              value={form.registrationCode}
              onChange={(e) =>
                setForm({ ...form, registrationCode: e.target.value.toUpperCase() })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-widest"
              placeholder="e.g. 7K2M9QX4"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">
                First name *
              </span>
              <input
                required
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Abebe"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Last name *
              </span>
              <input
                required
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kebede"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-2">
              Email *
            </span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </label>

          {form.role === "student" && (
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  Grade *
                </span>
                <select
                  value={form.grade}
                  onChange={(e) => update("grade", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  Stream
                </span>
                <select
                  value={form.stream}
                  onChange={(e) => update("stream", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Not selected</option>
                  <option value="natural">Natural Science</option>
                  <option value="social">Social Science</option>
                </select>
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Password *
              </span>
              <PasswordInput
                value={form.password}
                onChange={(value) => update("password", value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Confirm password *
              </span>
              <PasswordInput
                value={form.confirmPassword}
                onChange={(value) => update("confirmPassword", value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            At least 8 characters with an uppercase letter and a number.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create free account"}
          </button>
        </form>

        <p className="text-center text-slate-600 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-slate-400 mt-4">
          Only students and teachers can self-register. Administrator accounts are
          created by the platform owner.
        </p>

        <div className="text-center mt-6 pt-5 border-t border-slate-100">
          <ClearDataButton />
        </div>
      </div>
    </div>
  );
}
