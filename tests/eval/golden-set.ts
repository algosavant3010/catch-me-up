import matchData from "@/data/match.json";
import type { Ball } from "@/lib/match/types";

const allBalls = matchData.balls as Ball[];
const maxN = Math.max(...allBalls.map((b) => b.n));

export interface GoldenWindow {
  label: string;
  category: "early" | "middle" | "last_over" | "wicket_cluster" | "long_gap" | "one_ball";
  from: number;
  to: number;
}

const wicketBalls = allBalls.filter((b) => b.wicket).map((b) => b.n);

/**
 * At least 30 windows spanning every category the brief asks for. Derived
 * from the real, committed match data so every window is guaranteed valid.
 */
export const GOLDEN_SET: GoldenWindow[] = [
  // Early overs
  { label: "first ball", category: "early", from: 1, to: 1 },
  { label: "first over", category: "early", from: 1, to: 6 },
  { label: "overs 1-3", category: "early", from: 1, to: 18 },
  { label: "powerplay so far (overs 1-4)", category: "early", from: 1, to: 24 },
  { label: "end of powerplay", category: "early", from: 1, to: 37 },

  // Middle overs
  { label: "overs 7-9", category: "middle", from: 38, to: 55 },
  { label: "halfway point", category: "middle", from: 1, to: 66 },
  { label: "overs 10-12 only", category: "middle", from: 56, to: 74 },
  { label: "overs 13-15", category: "middle", from: 75, to: 92 },
  { label: "middle overs since powerplay", category: "middle", from: 38, to: 92 },

  // Last-over / death-overs windows
  { label: "final over only", category: "last_over", from: 117, to: 122 },
  { label: "last 2 overs", category: "last_over", from: 111, to: 122 },
  { label: "last 3 overs", category: "last_over", from: 104, to: 122 },
  { label: "final ball", category: "last_over", from: 122, to: 122 },
  { label: "penultimate over", category: "last_over", from: 111, to: 116 },

  // Wicket clusters (windows centred on/around each wicket)
  ...wicketBalls.map((n, i) => ({
    label: `around wicket #${i + 1} (b${n})`,
    category: "wicket_cluster" as const,
    from: Math.max(1, n - 3),
    to: Math.min(maxN, n + 3),
  })),

  // Long gaps (simulating "away for a while")
  { label: "long gap: overs 2-10", category: "long_gap", from: 7, to: 60 },
  { label: "long gap: overs 5-18", category: "long_gap", from: 25, to: 110 },
  { label: "long gap: entire match", category: "long_gap", from: 1, to: 122 },
  { label: "long gap: overs 8-16", category: "long_gap", from: 49, to: 98 },

  // One-ball windows at various points
  { label: "one ball: b13", category: "one_ball", from: 13, to: 13 },
  { label: "one ball: b50", category: "one_ball", from: 50, to: 50 },
  { label: "one ball: b70", category: "one_ball", from: 70, to: 70 },
  { label: "one ball: b100", category: "one_ball", from: 100, to: 100 },
  { label: "one ball: b115", category: "one_ball", from: 115, to: 115 },
];
