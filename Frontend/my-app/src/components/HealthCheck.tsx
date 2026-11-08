"use client";

import { useEffect } from "react";

export function HealthCheck() {
  useEffect(() => {
    const controller = new AbortController();
    const apiPrefix = process.env.NEXT_PUBLIC_API_PREFIX;

    if (!apiPrefix) {
      console.error("NEXT_PUBLIC_API_PREFIX is not configured.");
      return () => controller.abort();
    }

    fetch(`${apiPrefix}/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Backend health check failed.", error);
      });

    return () => controller.abort();
  }, []);

  return null;
}
