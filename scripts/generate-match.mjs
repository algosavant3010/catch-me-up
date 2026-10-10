// Deterministic generator for the fixed, fictional simulated T20 chase.
// Run once with `node scripts/generate-match.mjs` and commit the output
// (data/match.json). Not executed at runtime by the app — see
// docs/DECISIONS.md #8. No real players, teams or data are used.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BATTING_ORDER = [
  "Rohan Iyer",
  "Vikram Shah",
  "Arjun Mehta",
  "Kiran Desai",
  "Sahil Nair",
  "Dev Patel",
  "Aditya Rao",
  "Farhan Sheikh",
  "Imran Qureshi",
  "Yusuf Khan",
  "Karthik Subramaniam",
];

const BOWLER_ROTATION = [
  "Marcus Boyd",
  "Trent Walsh",
  "Zaheer Baig",
  "Harshal Deshpande",
  "Sunil Thakur",
];

// Each over is a compact token list. Tokens:
//   "0".."6"  -> legal ball, runs off the bat, no wicket
//   "W"       -> legal ball, striker dismissed, 0 runs off the bat
//   "Wd"      -> wide: +1 team run, not a legal ball, no batter change
//   "Nb"      -> no-ball: +1 team run, not a legal ball, no batter change
const OVERS = [
  ["1", "1", "4", "0", "1", "0"],
  ["0", "1", "W", "4", "0", "1"],
  ["1", "0", "1", "4", "0", "1"],
  ["4", "1", "0", "6", "1", "0"],
  ["Wd", "1", "0", "4", "1", "0", "W"],
  ["1", "1", "1", "0", "0", "4"],
  ["0", "0", "1", "0", "1", "0"],
  ["1", "W", "0", "1", "0", "1"],
  ["4", "0", "1", "6", "1", "0"],
  ["0", "1", "Nb", "4", "0", "1", "W"],
  ["1", "1", "0", "1", "1", "0"],
  ["0", "W", "0", "0", "1", "0"],
  ["4", "1", "0", "6", "0", "1"],
  ["1", "0", "1", "W", "0", "4"],
  ["0", "1", "0", "1", "0", "1"],
  ["1", "4", "0", "1", "W", "1"],
  ["6", "0", "1", "0", "1", "0"],
  ["1", "0", "W", "4", "1", "0"],
  ["1", "1", "4", "0", "1", "1"],
  ["1", "W", "0", "4", "1", "6"],
];

const TARGET = 136;

function simulate() {
  const balls = [];
  let n = 0;
  let teamRuns = 0;
  let teamWickets = 0;
  let nextBatterIndex = 2; // indices 0,1 already at the crease
  let striker = { name: BATTING_ORDER[0], runs: 0, balls: 0 };
  let nonStriker = { name: BATTING_ORDER[1], runs: 0, balls: 0 };

  OVERS.forEach((tokens, overIdx) => {
    const over = overIdx + 1;
    const bowler = BOWLER_ROTATION[overIdx % BOWLER_ROTATION.length];
    let legalCount = 0;

    for (const token of tokens) {
      n += 1;
      const ballInOver = legalCount + 1;

      if (token === "Wd" || token === "Nb") {
        teamRuns += 1;
        balls.push({
          n,
          over,
          ballInOver,
          runs: 1,
          wicket: false,
          batter: striker.name,
          bowler,
          batterRunsAfter: striker.runs,
          extras: token === "Wd" ? "wide" : "noball",
          isLegal: false,
        });
        continue;
      }

      legalCount += 1;
      striker.balls += 1;

      if (token === "W") {
        teamWickets += 1;
        balls.push({
          n,
          over,
          ballInOver,
          runs: 0,
          wicket: true,
          batter: striker.name,
          bowler,
          batterRunsAfter: striker.runs,
          isLegal: true,
        });
        const incoming = BATTING_ORDER[nextBatterIndex];
        nextBatterIndex += 1;
        striker = { name: incoming, runs: 0, balls: 0 };
        continue;
      }

      const runs = Number(token);
      teamRuns += runs;
      striker.runs += runs;
      balls.push({
        n,
        over,
        ballInOver,
        runs,
        wicket: false,
        batter: striker.name,
        bowler,
        batterRunsAfter: striker.runs,
        isLegal: true,
      });

      if (runs % 2 === 1) {
        [striker, nonStriker] = [nonStriker, striker];
      }
    }

    // Ends change at the end of every completed over.
    [striker, nonStriker] = [nonStriker, striker];

    if (teamRuns >= TARGET) {
      return; // match already won mid-generation guard (not used, win lands on final ball)
    }
  });

  return { balls, teamRuns, teamWickets };
}

const { balls, teamRuns, teamWickets } = simulate();

const meta = {
  id: "sim-2026-final-chase",
  isSimulated: true,
  venue: "Fictional Wankhede-style Stadium, Mumbai (simulated)",
  battingTeam: { name: "Konkan Kings", players: BATTING_ORDER },
  bowlingTeam: { name: "Deccan Daredevils", players: BOWLER_ROTATION },
  target: TARGET,
  oversLimit: 20,
  firstInningsSummary: "Deccan Daredevils 135 all out in 19.4 overs (simulated, not a real match)",
};

const output = { meta, balls };

const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "match.json");
writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n", "utf8");

console.log(
  `Generated ${balls.length} deliveries. Final score: ${teamRuns}/${teamWickets}. Target: ${TARGET}.`,
);
console.log(teamRuns >= TARGET ? "Result: Konkan Kings WIN" : "Result: Konkan Kings fall short");
