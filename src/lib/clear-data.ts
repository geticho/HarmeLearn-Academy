/**
 * Clears EVERYTHING the app has stored on this device:
 *  - localStorage (incl. legacy keys from older app versions)
 *  - sessionStorage
 *  - the server session cookie (signs you out)
 *  - the service worker registration (PWA offline layer)
 *  - all cache storage (cached pages + cached dashboard data)
 *
 * Server-side data (accounts, courses, content) lives in the database and is
 * NOT touched by this — only the device's stored data is removed.
 */
export async function clearAllStoredData(): Promise<void> {
  // 1. localStorage / sessionStorage
  try {
    localStorage.clear();
  } catch {
    /* storage unavailable */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* storage unavailable */
  }

  // 2. Server session cookie (best-effort sign-out)
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    /* offline — cookie cleared when the page reloads */
  }

  // 3. Service worker (PWA) + its caches
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
  }

  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* ignore */
    }
  }
}
