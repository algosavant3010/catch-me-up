"use client";

import { useState } from "react";
import { useMatchRuntime } from "@/lib/match/match-context";
import { usePreferences } from "@/components/providers/preferences-provider";
import { CatchMeUpSheet } from "@/components/recap/CatchMeUpSheet";
import { SamjhaoSheet } from "@/components/ask/SamjhaoSheet";
import { AwayBadge } from "@/components/away/AwayBadge";

export function ActionBar() {
  const { strings } = usePreferences();
  const { balls, lastSeenBall, markSeenUpToNow, awayFromBall, goAway, comeBack } = useMatchRuntime();
  const [recapWindow, setRecapWindow] = useState<{ from: number; to: number } | null>(null);
  const [askOpen, setAskOpen] = useState(false);

  const latestBall = balls.length > 0 ? balls[balls.length - 1].n : 0;

  const openCatchMeUp = () => {
    const from = lastSeenBall + 1;
    setRecapWindow({ from: Math.min(from, latestBall), to: latestBall });
  };

  const closeCatchMeUp = () => {
    markSeenUpToNow();
    setRecapWindow(null);
  };

  const handleAway = () => {
    if (awayFromBall === null) {
      goAway();
    } else {
      setRecapWindow(comeBack());
    }
  };

  return (
    <>
      <AwayBadge />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-surface) px-4 py-3 sm:static sm:rounded-(--radius-lg) sm:border">
        <div className="mx-auto flex max-w-2xl items-center justify-around gap-2">
          <ActionButton label={strings["nav.catchMeUp"]} onClick={openCatchMeUp} />
          <ActionButton
            label={awayFromBall === null ? strings["nav.away"] : strings["away.imBack"]}
            onClick={handleAway}
            active={awayFromBall !== null}
          />
          <ActionButton label={strings["nav.ask"]} onClick={() => setAskOpen(true)} />
        </div>
      </nav>

      {recapWindow && <CatchMeUpSheet open onClose={closeCatchMeUp} from={recapWindow.from} to={recapWindow.to} />}
      <SamjhaoSheet open={askOpen} onClose={() => setAskOpen(false)} />
    </>
  );
}

function ActionButton({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-(--radius-md) px-4 py-2.5 text-sm font-semibold ${
        active ? "bg-(--color-accent) text-white" : "bg-(--color-surface-2) text-(--color-text)"
      }`}
    >
      {label}
    </button>
  );
}
