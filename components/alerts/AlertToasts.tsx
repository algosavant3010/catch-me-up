"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMatchState } from "@/lib/match/use-match-state";
import { alertsStore } from "@/lib/alerts/alerts-store";
import type { KeyMoment } from "@/lib/match/types";

interface Toast extends KeyMoment {
  id: number;
}

export function AlertToasts() {
  const { keyMoments } = useMatchState();
  const prefs = useSyncExternalStore(
    alertsStore.subscribe,
    alertsStore.getSnapshot,
    alertsStore.getServerSnapshot,
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seenRef = useRef(new Set<number>());
  const idRef = useRef(0);

  useEffect(() => {
    const fresh = keyMoments.filter(
      (m) => !seenRef.current.has(m.ballNumber * 10 + kindRank(m.kind)),
    );
    if (fresh.length === 0) return;

    for (const moment of fresh) {
      seenRef.current.add(moment.ballNumber * 10 + kindRank(moment.kind));
      const id = idRef.current++;
      setToasts((prev) => [...prev, { ...moment, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);

      if (
        prefs.notificationsOptIn &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification("Catch Me Up", { body: moment.description });
      }
      if (prefs.vibrationOptIn && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(moment.kind === "wicket" ? [80, 40, 80] : 60);
      }
    }
  }, [keyMoments, prefs.notificationsOptIn, prefs.vibrationOptIn]);

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-x-3 top-3 z-40 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end"
    >
      {toasts.slice(-2).map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full max-w-sm rounded-(--radius-md) border border-l-2 border-(--color-border) border-l-(--color-accent) bg-(--color-surface) px-4 py-3 text-sm shadow-md"
        >
          {toast.description}
        </div>
      ))}
    </div>
  );
}

function kindRank(kind: KeyMoment["kind"]): number {
  return { wicket: 0, boundary: 1, powerplay_end: 2, final_over: 3, result: 4 }[kind];
}
