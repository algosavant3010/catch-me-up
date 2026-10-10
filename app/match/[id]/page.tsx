import matchData from "@/data/match.json";
import type { MatchMeta } from "@/lib/match/types";
import { MatchExperience } from "@/components/match/MatchExperience";

const meta = matchData.meta as MatchMeta;

// Our one bundled simulated match always resolves regardless of the [id] in
// the URL — the route param exists so the architecture supports multiple
// matches later (see docs/DECISIONS.md), but today there is only one.
const JOIN_LATE_BALL = 90;

export default async function MatchPage({ searchParams }: PageProps<"/match/[id]">) {
  const resolvedSearchParams = await searchParams;
  const joinLate = resolvedSearchParams?.join === "late";

  return <MatchExperience meta={meta} startAtBall={joinLate ? JOIN_LATE_BALL : 0} />;
}
