import type { Ball, MatchMeta, MatchProvider } from "../types";

/**
 * Documents the integration point for a real live-match data vendor.
 * Deliberately NOT implemented: this app never connects to, nor claims to
 * connect to, a real live cricket feed (see docs/DECISIONS.md and the
 * "Honesty" principle in the brief). Wiring up a real provider here is the
 * only change a production deployment would need — the rest of the engine,
 * routes and UI are provider-agnostic.
 */
export class LiveProviderStub implements MatchProvider {
  async getMeta(): Promise<MatchMeta> {
    throw new Error(
      "LiveProviderStub is not implemented. This demo only ships SimulatedProvider/ReplayProvider.",
    );
  }

  getBalls(): Ball[] {
    console.warn("LiveProviderStub.getBalls() called — no live data source is configured.");
    return [];
  }

  stream(): () => void {
    console.warn("LiveProviderStub.stream() called — no live data source is configured.");
    return () => {};
  }
}
