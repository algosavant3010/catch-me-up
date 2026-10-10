import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "../types";
import { ReplayEngine } from "../replay-engine";

const meta = matchData.meta as MatchMeta;
const balls = matchData.balls as Ball[];

/**
 * Default provider: our fixed, fictional, deterministic T20 chase
 * (data/match.json, produced once by scripts/generate-match.mjs). This is
 * the only provider used by the deployed demo.
 */
export class SimulatedProvider extends ReplayEngine {
  constructor() {
    super(meta, balls);
  }
}
