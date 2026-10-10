/**
 * Privacy-safe analytics: anonymous event-COUNTS only. No user id, no
 * session id, no text content, no IP stored beyond the rate limiter's
 * short-lived counter. Each event is just a name — see docs/ARCHITECTURE.md
 * "Privacy" section. Respects a local opt-out (see lib/analytics/track.ts).
 */
export const ANALYTICS_EVENTS = [
  "recap_requested",
  "recap_verified",
  "recap_fallback",
  "ref_opened",
  "away_started",
  "away_ended",
  "ask_submitted",
  "prediction_made",
  "share_clicked",
  "vision_sync_attempted",
  "vision_sync_succeeded",
  "room_created",
  "room_joined",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
