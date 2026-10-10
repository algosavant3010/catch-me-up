"use client";

import { useEffect, useState } from "react";
import { useMatchRuntime } from "@/lib/match/match-context";
import { spoilerStore } from "@/lib/spoiler/delay-store";
import { computeOffsetSeconds, type CalibrationTap } from "@/lib/spoiler/calibration";
import { usePreferences } from "@/components/providers/preferences-provider";
import { t } from "@/lib/i18n";

const REQUIRED_TAPS = 2;

export function SpoilerShieldPanel() {
  const { strings } = usePreferences();
  const { delaySeconds, onBallEmitted } = useMatchRuntime();
  const [calibrating, setCalibrating] = useState(false);
  const [taps, setTaps] = useState<CalibrationTap[]>([]);
  const [pendingEmittedAt, setPendingEmittedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!calibrating) return;
    return onBallEmitted((ball, emittedAt) => {
      if (ball.wicket || ball.runs === 4 || ball.runs === 6) {
        setPendingEmittedAt(emittedAt);
      }
    });
  }, [calibrating, onBallEmitted]);

  const recordTap = () => {
    if (pendingEmittedAt === null) return;
    const nextTaps = [...taps, { emittedAt: pendingEmittedAt, tappedAt: Date.now() }];
    setTaps(nextTaps);
    setPendingEmittedAt(null);
    if (nextTaps.length >= REQUIRED_TAPS) {
      spoilerStore.set({ delaySeconds: computeOffsetSeconds(nextTaps) });
      setCalibrating(false);
      setTaps([]);
    }
  };

  return (
    <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <h3 className="font-semibold">{strings["spoiler.title"]}</h3>
      <p className="mt-1 text-sm text-(--color-text-muted)">
        {delaySeconds > 0
          ? t(strings, "spoiler.behindBy", { seconds: delaySeconds })
          : "No delay set."}
      </p>

      {!calibrating ? (
        <button
          type="button"
          onClick={() => setCalibrating(true)}
          className="mt-3 rounded-full bg-(--color-accent) px-4 py-2 text-sm font-medium text-white"
        >
          {strings["spoiler.calibrate"]}
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm">
            Tap the button the instant you see the next wicket or boundary on your own TV or stream.
            ({taps.length}/{REQUIRED_TAPS} taps)
          </p>
          <button
            type="button"
            onClick={recordTap}
            disabled={pendingEmittedAt === null}
            className="rounded-full bg-(--color-accent) px-4 py-3 text-base font-semibold text-white disabled:opacity-40"
          >
            {pendingEmittedAt === null ? "Waiting for the next moment…" : "Tap now!"}
          </button>
        </div>
      )}
    </section>
  );
}
