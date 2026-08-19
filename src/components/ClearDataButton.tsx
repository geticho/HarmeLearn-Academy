"use client";

import { useState } from "react";
import { clearAllStoredData } from "@/lib/clear-data";

/**
 * "Clear all stored data" button — wipes everything saved on this device
 * (localStorage, sessionStorage, session cookie, PWA caches, service worker)
 * and reloads to a clean login page.
 */
export default function ClearDataButton({
  className = "",
  label = "🧹 Clear all saved data on this device",
}: {
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    await clearAllStoredData();
    setBusy(false);
    setDone(true);
    // Give the UI a moment to show the confirmation, then start fresh.
    setTimeout(() => {
      window.location.href = "/login";
    }, 700);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`text-sm text-slate-400 hover:text-slate-600 transition disabled:opacity-50 ${className}`}
    >
      {busy ? "Clearing…" : done ? "✓ Cleared — reloading…" : label}
    </button>
  );
}
