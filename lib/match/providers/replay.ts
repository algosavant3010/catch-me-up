import type { Ball, MatchMeta } from "../types";
import { ReplayEngine } from "../replay-engine";

/**
 * Generic replay provider for any externally-sourced ball-by-ball log that
 * has already been normalised into our `Ball[]` shape. Use this for "open
 * ball-by-ball data" (e.g. a historical match log fetched from a public
 * dataset and adapted into our schema) — the adapter/parsing step is the
 * caller's responsibility; this class never fetches or trusts unvalidated
 * network data itself.
 */
export class ReplayProvider extends ReplayEngine {
  constructor(meta: MatchMeta, balls: Ball[]) {
    super(meta, balls);
  }
}
