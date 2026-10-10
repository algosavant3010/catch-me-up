import { ImageResponse } from "next/og";
import matchData from "@/data/match.json";
import type { Ball, MatchMeta } from "@/lib/match/types";
import { getBallProof } from "@/lib/match/engine";

export const runtime = "nodejs";

const meta = matchData.meta as MatchMeta;
const allBalls = matchData.balls as Ball[];

/**
 * Share cards never accept freeform text from the client — only a validated
 * ball number. All display text is derived server-side from the match
 * engine, which is what actually prevents arbitrary text injection (a
 * signature would only protect text we shouldn't be accepting in the first
 * place).
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const ballParam = searchParams.get("ball");
  const ballNumber = ballParam ? Number(ballParam) : NaN;

  if (!Number.isInteger(ballNumber)) {
    return renderCard({
      title: "Catch Me Up",
      subtitle: "A simulated cricket second-screen companion.",
    });
  }

  const proof = getBallProof(allBalls, meta, ballNumber);
  if (!proof) {
    return renderCard({
      title: "Catch Me Up",
      subtitle: "A simulated cricket second-screen companion.",
    });
  }

  const title = proof.ball.wicket
    ? `WICKET! ${proof.ball.batter} out, b${proof.ball.bowler}`
    : proof.ball.runs === 6
      ? `SIX! ${proof.ball.batter}`
      : proof.ball.runs === 4
        ? `FOUR! ${proof.ball.batter}`
        : `${meta.battingTeam.name}: ${proof.scoreAfter.runs}/${proof.scoreAfter.wickets}`;
  const subtitle = `${proof.scoreAfter.runs}/${proof.scoreAfter.wickets} · win probability ${Math.round(proof.winProbAfter * 100)}%`;

  return renderCard({ title, subtitle });
}

function renderCard({ title, subtitle }: { title: string; subtitle: string }) {
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "80px",
        background: "linear-gradient(135deg, #3c2a8e 0%, #7a2fb0 55%, #e23fae 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 24 }}>
        Catch Me Up · Simulated match
      </div>
      <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.15 }}>{title}</div>
      <div style={{ fontSize: 32, marginTop: 24, opacity: 0.9 }}>{subtitle}</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
