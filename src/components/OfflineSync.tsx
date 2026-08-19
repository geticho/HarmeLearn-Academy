"use client";

import { useEffect, useState } from "react";
import { syncQueuedSubmissions, getSubmissionQueue } from "@/lib/offline-assessments";

/**
 * Keeps offline quiz/exam submissions in sync when connectivity returns.
 */
export default function OfflineSync() {
  const [pending, setPending] = useState(0);
  const [message, setMessage] = useState("");

  async function refreshPending() {
    setPending(getSubmissionQueue().length);
  }

  async function syncNow() {
    const n = await syncQueuedSubmissions();
    await refreshPending();
    if (n > 0) {
      setMessage(`Synced ${n} offline submission${n > 1 ? "s" : ""}`);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  useEffect(() => {
    refreshPending();
    const onOnline = () => {
      syncNow();
    };
    window.addEventListener("online", onOnline);
    // Try once on mount too
    if (navigator.onLine) syncNow();
    return () => window.removeEventListener("online", onOnline);
  }, []);

  if (pending <= 0 && !message) return null;

  return (
    <div className="fixed bottom-16 left-5 z-[100] max-w-xs rounded-xl bg-emerald-900/95 text-emerald-50 px-4 py-3 text-sm shadow-lg border border-emerald-400/30">
      {message ? (
        <p>✅ {message}</p>
      ) : (
        <div className="flex items-center gap-3">
          <p>
            ⏳ {pending} offline quiz/exam submission
            {pending > 1 ? "s" : ""} waiting
          </p>
          <button
            onClick={syncNow}
            className="shrink-0 rounded-lg bg-emerald-400 text-emerald-950 px-2.5 py-1 text-xs font-bold"
          >
            Sync
          </button>
        </div>
      )}
    </div>
  );
}
