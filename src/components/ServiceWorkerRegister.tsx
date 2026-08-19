"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production so the app shell and the
 * last-loaded dashboard data work offline.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort */
      });
    }
  }, []);

  return null;
}
