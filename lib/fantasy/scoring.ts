import type { Ball } from "@/lib/match/types";

export interface BatterFantasyScore {
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  out: boolean;
  points: {
    runPoints: number;
    boundaryBonus: number;
    sixBonus: number;
    milestoneBonus: number;
    duckPenalty: number;
    total: number;
  };
}

export interface BowlerFantasyScore {
  name: string;
  overs: string;
  legalBalls: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  economy: number;
  points: {
    wicketPoints: number;
    haulBonus: number;
    maidenBonus: number;
    economyBonus: number;
    total: number;
  };
}

export interface PlayerFantasyTotal {
  name: string;
  role: "batter" | "bowler" | "allrounder";
  totalPoints: number;
  breakdown: string;
}

export interface FantasyLeaderboard {
  mvp: PlayerFantasyTotal | null;
  topPerformers: PlayerFantasyTotal[];
  batters: BatterFantasyScore[];
  bowlers: BowlerFantasyScore[];
}

export function computeFantasyScores(balls: Ball[]): FantasyLeaderboard {
  const batterMap = new Map<
    string,
    { runs: number; balls: number; fours: number; sixes: number; out: boolean }
  >();
  const bowlerMap = new Map<
    string,
    { legalBalls: number; runs: number; wickets: number; overRuns: Map<number, number> }
  >();

  for (const b of balls) {
    // Batter stats
    const batter = batterMap.get(b.batter) ?? {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
    };
    if (b.extras !== "wide") {
      batter.balls += 1;
      const batRuns = b.extras === "noball" ? Math.max(0, b.runs - 1) : b.runs;
      batter.runs += batRuns;
      if (batRuns === 4) batter.fours += 1;
      if (batRuns === 6) batter.sixes += 1;
    }
    if (b.wicket) {
      batter.out = true;
    }
    batterMap.set(b.batter, batter);

    // Bowler stats
    const bowler = bowlerMap.get(b.bowler) ?? {
      legalBalls: 0,
      runs: 0,
      wickets: 0,
      overRuns: new Map<number, number>(),
    };
    if (b.isLegal) bowler.legalBalls += 1;
    // Bowler concedes all runs except byes and legbyes
    if (b.extras !== "bye" && b.extras !== "legbye") {
      bowler.runs += b.runs;
      const currOver = bowler.overRuns.get(b.over) ?? 0;
      bowler.overRuns.set(b.over, currOver + b.runs);
    }
    if (b.wicket) bowler.wickets += 1;
    bowlerMap.set(b.bowler, bowler);
  }

  // Calculate batter points
  const batters: BatterFantasyScore[] = Array.from(batterMap.entries()).map(([name, s]) => {
    const runPoints = s.runs;
    const boundaryBonus = s.fours * 1;
    const sixBonus = s.sixes * 2;
    let milestoneBonus = 0;
    if (s.runs >= 100) milestoneBonus = 16;
    else if (s.runs >= 50) milestoneBonus = 8;
    else if (s.runs >= 30) milestoneBonus = 4;
    const duckPenalty = s.out && s.runs === 0 && s.balls > 0 ? -2 : 0;
    const total = runPoints + boundaryBonus + sixBonus + milestoneBonus + duckPenalty;

    return {
      name,
      runs: s.runs,
      ballsFaced: s.balls,
      fours: s.fours,
      sixes: s.sixes,
      out: s.out,
      points: {
        runPoints,
        boundaryBonus,
        sixBonus,
        milestoneBonus,
        duckPenalty,
        total,
      },
    };
  });

  // Calculate bowler points
  const bowlers: BowlerFantasyScore[] = Array.from(bowlerMap.entries()).map(([name, s]) => {
    const oversInt = Math.floor(s.legalBalls / 6);
    const ballsRemainder = s.legalBalls % 6;
    const oversDisplay = `${oversInt}.${ballsRemainder}`;
    const oversDecimal = s.legalBalls / 6;

    let maidens = 0;
    for (const [, runs] of s.overRuns.entries()) {
      if (runs === 0) maidens += 1;
    }

    const wicketPoints = s.wickets * 25;
    let haulBonus = 0;
    if (s.wickets >= 5) haulBonus = 16;
    else if (s.wickets >= 4) haulBonus = 8;
    else if (s.wickets >= 3) haulBonus = 4;

    const maidenBonus = maidens * 12;

    const economy = oversDecimal > 0 ? s.runs / oversDecimal : 0;
    let economyBonus = 0;
    if (oversDecimal >= 2) {
      if (economy < 5.0) economyBonus = 6;
      else if (economy < 6.0) economyBonus = 4;
      else if (economy <= 7.0) economyBonus = 2;
      else if (economy > 11.0) economyBonus = -6;
      else if (economy >= 10.0) economyBonus = -2;
    }

    const total = wicketPoints + haulBonus + maidenBonus + economyBonus;

    return {
      name,
      overs: oversDisplay,
      legalBalls: s.legalBalls,
      runsConceded: s.runs,
      wickets: s.wickets,
      maidens,
      economy: Number(economy.toFixed(2)),
      points: {
        wicketPoints,
        haulBonus,
        maidenBonus,
        economyBonus,
        total,
      },
    };
  });

  // Combined totals
  const allPlayers = new Map<string, PlayerFantasyTotal>();

  for (const b of batters) {
    allPlayers.set(b.name, {
      name: b.name,
      role: "batter",
      totalPoints: b.points.total,
      breakdown: `${b.runs} runs (${b.ballsFaced}b), ${b.fours}x4, ${b.sixes}x6`,
    });
  }

  for (const bw of bowlers) {
    const existing = allPlayers.get(bw.name);
    if (existing) {
      existing.role = "allrounder";
      existing.totalPoints += bw.points.total;
      existing.breakdown += ` • ${bw.wickets}/${bw.runsConceded} (${bw.overs} ov)`;
    } else {
      allPlayers.set(bw.name, {
        name: bw.name,
        role: "bowler",
        totalPoints: bw.points.total,
        breakdown: `${bw.wickets}/${bw.runsConceded} in ${bw.overs} ov`,
      });
    }
  }

  const sortedPerformers = Array.from(allPlayers.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints,
  );

  return {
    mvp: sortedPerformers[0] ?? null,
    topPerformers: sortedPerformers.slice(0, 5),
    batters,
    bowlers,
  };
}
