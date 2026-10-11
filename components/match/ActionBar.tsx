"use client";

import { useState } from "react";
import { CircleHelp, Coffee, Zap, type LucideIcon } from "lucide-react";
import { useMatchRuntime } from "@/lib/match/match-context";
import { usePreferences } from "@/components/providers/preferences-provider";
import { CatchMeUpSheet } from "@/components/recap/CatchMeUpSheet";
import { SamjhaoSheet } from "@/components/ask/SamjhaoSheet";
import { AwayBadge } from "@/components/away/AwayBadge";
import { track } from "@/lib/analytics/track";

export function ActionBar() {
  const { strings } = usePreferences();
  const { awayFromBall, goAway, comeBack, lastSeenBall, balls, markSeenUpToNow } =
    useMatchRuntime();
  const [recapOpen, setRecapOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [recapWindow, setRecapWindow] = useState<{ from: number; to: number }>({ from: 0, to: 0 });

  const currentBallNumber = balls.length > 0 ? balls[balls.length - 1].n : 0;

  const openCatchMeUp = () => {
    track("recap_requested");
    const from = Math.max(0, lastSeenBall);
    const to = currentBallNumber;
    setRecapWindow({ from, to });
    setRecapOpen(true);
    markSeenUpToNow();
  };

  const handleAway = () => {
    if (awayFromBall === null) {
      track("away_started");
      goAway();
    } else {
      track("away_ended");
      const window = comeBack();
      setRecapWindow(window);
      setRecapOpen(true);
    }
  };

  return (
    <>
      <AwayBadge />
      <nav
        aria-label="Match actions"
        className="action-dock fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-surface)/95 px-3 py-2.5 backdrop-blur-md sm:sticky sm:bottom-4 sm:mt-6 sm:rounded-2xl sm:border sm:px-4 sm:shadow-lg"
      >
        <div className="mx-auto flex max-w-2xl items-center justify-around gap-2.5">
          <ActionButton
            label={strings["nav.catchMeUp"]}
            onClick={openCatchMeUp}
            icon={Zap}
            primary
          />
          <ActionButton
            icon={Coffee}
            label={awayFromBall === null ? strings["nav.away"] : strings["away.imBack"]}
            onClick={handleAway}
            active={awayFromBall !== null}
          />
          <ActionButton
            label={strings["nav.ask"]}
            onClick={() => setAskOpen(true)}
            icon={CircleHelp}
          />
        </div>
      </nav>

      <CatchMeUpSheet
        open={recapOpen}
        onClose={() => setRecapOpen(false)}
        from={recapWindow.from}
        to={recapWindow.to}
      />
      <SamjhaoSheet open={askOpen} onClose={() => setAskOpen(false)} />
    </>
  );
}

function ActionButton({
  label,
  onClick,
  active,
  icon: Icon,
  primary,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  icon: LucideIcon;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold shadow-xs transition sm:px-4 sm:text-sm ${
        primary
          ? "button-primary"
          : active
            ? "border border-amber-500 bg-amber-500 text-white shadow-md hover:bg-amber-600"
            : "button-secondary"
      }`}
    >
      <Icon
        size={18}
        aria-hidden="true"
        className={
          primary ? "animate-pulse text-white" : active ? "text-white" : "text-(--color-accent)"
        }
      />
      <span>{label}</span>
    </button>
  );
}
