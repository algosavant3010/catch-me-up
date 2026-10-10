import Link from "next/link";
import matchData from "@/data/match.json";
import type { MatchMeta } from "@/lib/match/types";

const meta = matchData.meta as MatchMeta;

export default function MarketingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section
        className="flex flex-col items-center gap-6 px-6 py-20 text-center text-white sm:py-28"
        style={{ background: "var(--gradient-hero)" }}
      >
        <span className="rounded-full bg-black/20 px-4 py-1 text-xs font-medium tracking-wide uppercase">
          Simulated match — fictional teams, for demo purposes only
        </span>
        <h1 className="max-w-2xl text-4xl font-bold text-balance sm:text-5xl">Catch Me Up</h1>
        <p className="max-w-xl text-lg text-white/90">
          Missed a few overs? Get back into the match in 20 seconds — in your language, without
          spoilers, and every number checked before you see it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/match/${meta.id}`}
            className="rounded-full bg-white px-6 py-3 font-semibold text-[var(--color-accent-2)] shadow-md transition hover:scale-[1.02]"
          >
            Try the demo
          </Link>
          <Link
            href={`/match/${meta.id}?join=late`}
            className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Join late instead
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-6 py-16 sm:grid-cols-3">
        <Feature
          title="Verifiable by design"
          body="Every fact the AI states about a ball carries a reference. We validate every number before it reaches you — unverifiable output never ships."
        />
        <Feature
          title="Works with no AI"
          body="No API key, offline, or rate limited? The app still works. Every AI feature has a deterministic, non-AI fallback."
        />
        <Feature
          title="Built for real fans"
          body="Hindi, Hinglish, Tamil, Telugu, Marathi, Bengali, Kannada, Gujarati and Punjabi — on patchy data, on a lagging stream."
        />
      </section>

      <footer className="mx-auto w-full max-w-4xl px-6 pb-16 text-sm text-(--color-text-muted)">
        <p>
          No accounts. No stored questions or images. Anonymous usage counts only. This is a
          simulated match with fictional teams and players — it is not affiliated with Dream11, the
          BCCI, or any real league.
        </p>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
      <h2 className="mb-2 font-semibold">{title}</h2>
      <p className="text-sm text-(--color-text-muted)">{body}</p>
    </div>
  );
}
