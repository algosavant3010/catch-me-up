"use client";

import { useState } from "react";
import { getBallProof, type BallProof } from "@/lib/match/engine";
import { useMatchRuntime } from "@/lib/match/match-context";
import { Sheet } from "@/components/ui/Sheet";
import { usePreferences } from "@/components/providers/preferences-provider";
import { ShareButton } from "@/components/share/ShareButton";
import { track } from "@/lib/analytics/track";

export function RefChip({ ballNumber }: { ballNumber: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          track("ref_opened");
          setOpen(true);
        }}
        className="rounded-full border border-(--color-border) bg-(--color-surface) px-2 py-0.5 text-xs font-medium text-(--color-accent) hover:bg-(--color-surface-2)"
      >
        b{ballNumber}
      </button>
      <ProofDrawer ballNumber={ballNumber} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function ProofDrawer({
  ballNumber,
  open,
  onClose,
}: {
  ballNumber: number;
  open: boolean;
  onClose: () => void;
}) {
  const { meta, balls } = useMatchRuntime();
  const { strings } = usePreferences();
  const proof = open ? getBallProof(balls, meta, ballNumber) : null;

  return (
    <Sheet open={open} onClose={onClose} title={strings["recap.proofDrawerTitle"]}>
      {!proof ? (
        <p className="text-sm text-(--color-text-muted)">{strings["state.empty"]}</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Row
            label="Ball"
            value={`${proof.ball.over}.${proof.ball.ballInOver} (b${proof.ball.n})`}
          />
          <Row label={strings["scoreboard.bowler"]} value={proof.ball.bowler} />
          <Row label="Batter" value={proof.ball.batter} />
          <Row label="Outcome" value={outcomeOf(proof.ball)} />
          <Row label="Score after" value={`${proof.scoreAfter.runs}/${proof.scoreAfter.wickets}`} />
          <Row
            label={strings["scoreboard.winProbability"]}
            value={`${Math.round(proof.winProbBefore * 100)}% → ${Math.round(proof.winProbAfter * 100)}%`}
          />
        </dl>
      )}
      {proof && (
        <div className="mt-4">
          <ShareButton ballNumber={ballNumber} title={outcomeOf(proof.ball)} />
        </div>
      )}
    </Sheet>
  );
}

function outcomeOf(ball: BallProof["ball"]): string {
  if (ball.wicket) return "Wicket";
  if (ball.extras === "wide") return "Wide";
  if (ball.extras === "noball") return "No-ball";
  return `${ball.runs} run${ball.runs === 1 ? "" : "s"}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-(--color-text-muted)">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
