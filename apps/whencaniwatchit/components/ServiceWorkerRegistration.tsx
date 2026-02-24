"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_FEATURE_PWA === "true" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return null;
}
