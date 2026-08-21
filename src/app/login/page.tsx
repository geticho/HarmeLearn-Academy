"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import PasswordInput from "@/components/PasswordInput";
import ClearDataButton from "@/components/ClearDataButton";
import BrandLogo from "@/components/BrandLogo";

const HOME_BY_ROLE: Record<string, string> = {
  super_admin: "/admin",
  school_admin: "/admin",
  teacher: "/dashboard/teacher",
  student: "/dashboard/student",
  parent: "/dashboard/student",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Destination comes from the role returned by the server.
      const destination = next || HOME_BY_ROLE[data.user.role] || "/";
      router.push(destination);
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10 sm:p-12 border border-slate-200">
      <div className="flex justify-center mb-6">
        <BrandLogo size={48} />
      </div>

      <h1 className="text-3xl font-bold text-center mb-3 text-slate-900">
        Welcome back
      </h1>
      <p className="text-center text-slate-600 mb-10">
        Sign in with the details your school gave you
      </p>

      {/* One-click demo admin access */}
      <button
        type="button"
        onClick={() => {
          setForm({ email: "getidaba3@gmail.com", password: "geti430@" });
          setTimeout(() => {
            const btn = document.getElementById(
              "signin-submit"
            ) as HTMLButtonElement | null;
            btn?.click();
          }, 50);
        }}
        className="w-full mb-6 px-4 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
      >
        🛡️ Sign in as Administrator (demo)
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 uppercase tracking-wide">
          or with email
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-2.5">
            Email
          </span>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your email"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-2.5">
            Password
          </span>
          <PasswordInput
            value={form.password}
            onChange={(value) => setForm({ ...form, password: value })}
            placeholder="your passord"
            autoComplete="current-password"
          />
        </label>

        <button
          id="signin-submit"
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-8">
        No account?{" "}
        <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
          Create one here
        </Link>
      </p>

      <div className="text-center mt-6 pt-5 border-t border-slate-100">
        <ClearDataButton />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent py-16 px-6">
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
