"use client";

import { useState } from "react";

/**
 * Danger zone for the Admin Console: permanently deletes ALL registered
 * student / teacher accounts (super admin only — enforced server-side).
 */
export default function DangerZone() {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState("");

  async function wipe(scope: "students" | "teachers" | "all") {
    const label =
      scope === "students"
        ? "ALL STUDENT accounts"
        : scope === "teachers"
          ? "ALL TEACHER accounts"
          : "ALL student AND teacher accounts";
    if (
      !window.confirm(
        `⚠️ This permanently deletes ${label} and all of their data (profiles, sessions, quiz results, submissions, certificates).\n\nAdministrators are NOT affected. This cannot be undone.\n\nContinue?`
      )
    ) {
      return;
    }

    setBusy(scope);
    setResult("");
    try {
      const res = await fetch("/api/admin/users/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(`❌ ${data.error || "Failed"}`);
      } else {
        setResult(`✅ ${data.message}`);
      }
    } catch {
      setResult("❌ Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="bg-white border border-red-200 rounded-xl p-8">
      <h2 className="text-lg font-bold text-slate-900 mb-2">Danger zone</h2>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        Permanently delete every account that registered on the website. Courses
        and content are kept — only the registered people are removed.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => wipe("students")}
          disabled={busy !== null}
          className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
        >
          {busy === "students" ? "Deleting…" : "Delete all students"}
        </button>
        <button
          onClick={() => wipe("teachers")}
          disabled={busy !== null}
          className="px-5 py-2.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
        >
          {busy === "teachers" ? "Deleting…" : "Delete all teachers"}
        </button>
        <button
          onClick={() => wipe("all")}
          disabled={busy !== null}
          className="px-5 py-2.5 bg-red-900 text-white rounded-lg font-semibold hover:bg-red-950 transition disabled:opacity-50"
        >
          {busy === "all" ? "Deleting…" : "Delete all students & teachers"}
        </button>
      </div>
      {result && (
        <p className="mt-4 text-sm font-medium text-slate-700">{result}</p>
      )}
    </section>
  );
}
