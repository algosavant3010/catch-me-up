"use client";

import { ANALYTICS_EVENTS, type AnalyticsEvent } from "./events";
import { createPersistentStore } from "@/lib/utils/persistent-store";

interface AnalyticsOptOut extends Record<string, unknown> {
  optedOut: boolean;
}

export const analyticsOptOutStore = createPersistentStore<AnalyticsOptOut>(
  "catch-me-up:analytics-opt-out:v1",
  {
    optedOut: false,
  },
);

/** Fires a single anonymous event-count beacon. No-ops silently if opted out or unsupported. */
export function track(event: AnalyticsEvent): void {
  if (!ANALYTICS_EVENTS.includes(event)) return;
  if (analyticsOptOutStore.getSnapshot().optedOut) return;
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  navigator.sendBeacon("/api/analytics", JSON.stringify({ event }));
}
