"use client";

import { useEffect } from "react";

/**
 * Migration cleanup: older versions of HarmeLearn stored the user object and
 * session token in localStorage. The app now uses httpOnly cookies, so any
 * leftover keys are stale — remove them once on page load.
 */
export default function StoredDataCleanup() {
  useEffect(() => {
    try {
      const legacyKeys = ["user", "sessionToken", "harmelearn_user"];
      for (const key of legacyKeys) {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      /* storage unavailable */
    }
  }, []);

  return null;
}
