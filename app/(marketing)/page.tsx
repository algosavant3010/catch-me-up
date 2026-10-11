import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Zap } from "lucide-react";
import matchData from "@/data/match.json";
import type { MatchMeta } from "@/lib/match/types";

const meta = matchData.meta as MatchMeta;

export default function MarketingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="page-shell flex items-center justify-between gap-4 py-5">
        <span className="flex items-center gap-2 text-lg font-bold">
          <Zap className="text-(--color-accent-2)" aria-hidden="true" /> CATCH ME UP
        </span>
        <Link href={`/match/${meta.id}`} className="flex items-center gap-2 text-sm font-semibold">
          Match centre <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </header>
      <section className="landing-hero">
        <Image
          src="/cricket-ground.jpg"
          alt="A red cricket ball on the outfield"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[65%_60%]"
        />
        <div className="page-shell py-10 sm:py-14">
          <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase">
            <span className="h-0.5 w-8 bg-red-500" /> Every over matters
          </p>
          <h1 className="landing-title max-w-xl">Catch Me Up</h1>
          <p className="mt-5 max-w-sm text-lg text-white/90">
            Back in the game. Not behind the score.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={`/match/${meta.id}`} className="button-primary">
              Try the demo <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href={`/match/${meta.id}?join=late`}
              className="inline-flex min-h-11 items-center rounded-md border border-white/60 bg-black/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/50"
            >
              Join late instead
            </Link>
          </div>
          <p className="mt-6 max-w-sm text-xs text-white/80">
            Simulated match. Fictional teams. Real cricket energy.
          </p>
        </div>
      </section>
      <section className="page-shell flex flex-wrap items-center justify-between gap-5 border-b border-(--color-border) py-7">
        <div>
          <p className="eyebrow mb-1">Featured match / T20</p>
          <h2 className="text-xl font-bold">
            {meta.battingTeam.name}{" "}
            <span className="font-normal text-(--color-text-muted)">vs</span>{" "}
            {meta.bowlingTeam.name}
          </h2>
        </div>
        <Link href={`/match/${meta.id}?join=late`} className="button-secondary">
          Enter the chase <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
      <section className="page-shell grid gap-8 py-10 sm:grid-cols-3">
        <Feature
          title="01 / The turning point"
          body="A wicket. A boundary. An over that changes everything."
        />
        <Feature
          title="02 / The final chase"
          body="Twenty overs. One target. Right down to the last ball."
        />
        <Feature
          title="03 / The fan side"
          body="Big calls, close finishes, and bragging rights among friends."
        />
      </section>

      <footer className="page-shell border-t border-(--color-border) py-6 text-xs text-(--color-text-muted)">
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
    <div>
      <h2 className="mb-2 font-semibold">{title}</h2>
      <p className="text-sm text-(--color-text-muted)">{body}</p>
    </div>
  );
}
