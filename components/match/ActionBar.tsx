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
  const { balls, lastSeenBall, markSeenUpToNow, awayFromBall, goAway, comeBack } =
    useMatchRuntime();
  const [recapWindow, setRecapWindow] = useState<{ from: number; to: number } | null>(null);
  const [askOpen, setAskOpen] = useState(false);

  const latestBall = balls.length > 0 ? balls[balls.length - 1].n : 0;

  const openCatchMeUp = () => {
    track("recap_requested");
    const from = lastSeenBall + 1;
    setRecapWindow({ from: Math.min(from, latestBall), to: latestBall });
  };

  const closeCatchMeUp = () => {
    markSeenUpToNow();
    setRecapWindow(null);
  };

  const handleAway = () => {
    if (awayFromBall === null) {
      track("away_started");
      goAway();
    } else {
      track("away_ended");
      setRecapWindow(comeBack());
    }
  };

  return (
    <>
      <AwayBadge />
      <nav
        aria-label="Match actions"
        className="action-dock fixed inset-x-0 bottom-0 z-40 border-t border-(--color-border) bg-(--color-surface) px-3 py-3 sm:sticky sm:bottom-0 sm:mt-5 sm:border sm:px-4"
      >
        <div className="mx-auto flex max-w-2xl items-stretch justify-around gap-2">
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

      {recapWindow && (
        <CatchMeUpSheet open onClose={closeCatchMeUp} from={recapWindow.from} to={recapWindow.to} />
      )}
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
      className={`${primary || active ? "button-primary" : "button-secondary"} min-w-0 flex-1 flex-col gap-1 px-2 text-xs sm:flex-row sm:gap-2 sm:text-sm`}
    >
      <Icon size={18} aria-hidden="true" />
      {label}
    </button>
  );
}
