"use client";

import { useEffect, useState } from "react";

/** Shows a small pill when the browser is offline. */
export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[100] flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
      Offline — showing saved content
    </div>
  );
}
