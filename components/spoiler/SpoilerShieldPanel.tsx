"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
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
    <section className="settings-section">
      <h3 className="section-heading">
        <ShieldCheck aria-hidden="true" />
        {strings["spoiler.title"]}
      </h3>
      <p className="mt-1 text-sm text-(--color-text-muted)">
        {delaySeconds > 0
          ? t(strings, "spoiler.behindBy", { seconds: delaySeconds })
          : strings["spoiler.noDelay"]}
      </p>

      {!calibrating ? (
        <button
          type="button"
          onClick={() => setCalibrating(true)}
          className="button-secondary mt-3 w-full"
        >
          {strings["spoiler.calibrate"]}
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm">
            {strings["spoiler.tapInstruction"]} ({taps.length}/{REQUIRED_TAPS})
          </p>
          <button
            type="button"
            onClick={recordTap}
            disabled={pendingEmittedAt === null}
            className="button-primary"
          >
            {pendingEmittedAt === null ? strings["spoiler.waiting"] : strings["spoiler.tapNow"]}
          </button>
        </div>
      )}
    </section>
  );
}
