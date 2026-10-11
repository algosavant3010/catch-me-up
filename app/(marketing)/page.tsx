"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Flame,
  Globe,
  MessageCircleQuestion,
  Moon,
  Scale,
  Sparkles,
  Sun,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import matchData from "@/data/match.json";
import type { MatchMeta } from "@/lib/match/types";
import { usePreferences } from "@/components/providers/preferences-provider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const meta = matchData.meta as MatchMeta;

export default function MarketingPage() {
  const { strings, theme, setTheme } = usePreferences();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <main className="flex flex-1 flex-col">
      {/* Top Navbar with Language Switcher and Theme Toggle */}
      <header className="page-shell flex items-center justify-between gap-4 py-4 sm:py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
          aria-label="Catch Me Up home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-(--color-accent)/15 text-(--color-accent)">
            <Zap className="size-5" aria-hidden="true" />
          </span>
          <span className="font-extrabold tracking-tight">CATCH ME UP</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="icon-button size-9 rounded-xl border border-(--color-border) bg-(--color-surface-2)/70"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link
            href={`/match/${meta.id}`}
            className="button-secondary h-9 px-3.5 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm"
          >
            {strings["landing.matchCentre"]} <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero relative">
        <Image
          src="/cricket-ground.jpg"
          alt="A red cricket ball on the outfield"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-[65%_60%]"
        />
        <div className="page-shell py-12 sm:py-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-white uppercase backdrop-blur-md">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            {strings["landing.heroBadge"]}
          </div>
          <h1 className="landing-title max-w-2xl text-white">{strings["landing.heroTitle"]}</h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-white/90 sm:text-xl">
            {strings["landing.heroSubtitle"]}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/match/${meta.id}`} className="button-primary text-sm shadow-lg">
              {strings["landing.ctaTry"]} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              href={`/match/${meta.id}?join=late`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-black/50 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-black/70 active:translate-y-px"
            >
              {strings["landing.ctaJoinLate"]}
            </Link>
          </div>
          <p className="mt-6 max-w-sm text-xs font-medium text-white/75">
            {strings["landing.simulatedTag"]}
          </p>
        </div>
      </section>

      {/* Broadcast Live Match Card */}
      <section className="page-shell py-8 sm:py-10">
        <div className="relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 shadow-md sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-(--color-border) pb-5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent)/10 px-3 py-1 text-xs font-bold tracking-wider text-(--color-accent) uppercase">
                <Trophy size={14} aria-hidden="true" />
                {strings["landing.featuredMatch"]}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-(--color-success)">
                <span className="size-2 animate-pulse rounded-full bg-(--color-success)" />
                {strings["landing.liveChase"]}
              </span>
            </div>
            <Link
              href={`/match/${meta.id}?join=late`}
              className="button-primary h-10 px-4 text-xs font-bold sm:text-sm"
            >
              {strings["landing.enterChase"]} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {meta.battingTeam.name}{" "}
                <span className="font-light text-(--color-text-muted)">vs</span>{" "}
                {meta.bowlingTeam.name}
              </h2>
              <p className="mt-2 text-sm text-(--color-text-muted)">
                {strings["landing.matchDescription"]}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:justify-end">
              <div className="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-4 py-3 text-center">
                <p className="text-[10px] font-bold tracking-wider text-(--color-text-muted) uppercase">
                  {strings["landing.target"]}
                </p>
                <p className="text-xl font-bold tabular-nums">136</p>
              </div>
              <div className="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-4 py-3 text-center">
                <p className="text-[10px] font-bold tracking-wider text-(--color-text-muted) uppercase">
                  {strings["landing.overs"]}
                </p>
                <p className="text-xl font-bold tabular-nums">20.0</p>
              </div>
              <div className="rounded-xl border border-(--color-border) bg-(--color-surface-2) px-4 py-3 text-center">
                <p className="text-[10px] font-bold tracking-wider text-(--color-text-muted) uppercase">
                  {strings["landing.format"]}
                </p>
                <p className="text-xl font-bold">T20</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid - Gen-Z / High Energy Fan Capabilities */}
      <section className="page-shell py-6 pb-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface-2) px-3 py-1 text-xs font-bold text-(--color-accent) uppercase tracking-wider mb-2">
            <Sparkles size={13} /> AI Companion Suite
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-(--color-text)">
            {strings["landing.featureHeader"]}
          </h2>
          <p className="mt-1 text-sm text-(--color-text-muted) max-w-2xl">
            {strings["landing.featureSubheader"]}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={Zap}
            tag={strings["feat.catchmeup.tag"]}
            title={strings["feat.catchmeup.title"]}
            body={strings["feat.catchmeup.desc"]}
            link={`/match/${meta.id}?join=late`}
            ctaText="Try Catch Up"
          />
          <FeatureCard
            icon={Trophy}
            tag={strings["feat.fantasy.tag"]}
            title={strings["feat.fantasy.title"]}
            body={strings["feat.fantasy.desc"]}
            link={`/match/${meta.id}`}
            ctaText="Check MVP Radar"
          />
          <FeatureCard
            icon={Sparkles}
            tag={strings["feat.whatif.tag"]}
            title={strings["feat.whatif.title"]}
            body={strings["feat.whatif.desc"]}
            link={`/match/${meta.id}`}
            ctaText="Simulate Chase"
          />
          <FeatureCard
            icon={Scale}
            tag={strings["feat.banter.tag"]}
            title={strings["feat.banter.title"]}
            body={strings["feat.banter.desc"]}
            link={`/match/${meta.id}`}
            ctaText="Settle Debates"
          />
          <FeatureCard
            icon={MessageCircleQuestion}
            tag={strings["feat.samjhao.tag"]}
            title={strings["feat.samjhao.title"]}
            body={strings["feat.samjhao.desc"]}
            link={`/match/${meta.id}`}
            ctaText="Ask Samjhao"
          />
          <FeatureCard
            icon={Flame}
            tag={strings["feat.game.tag"]}
            title={strings["feat.game.title"]}
            body={strings["feat.game.desc"]}
            link={`/match/${meta.id}`}
            ctaText="Call Next Over"
          />
          <FeatureCard
            icon={Users}
            tag={strings["feat.rooms.tag"]}
            title={strings["feat.rooms.title"]}
            body={strings["feat.rooms.desc"]}
            link={`/match/${meta.id}`}
            ctaText="Join Watch Party"
          />
          <FeatureCard
            icon={Globe}
            tag={strings["feat.i18n.tag"]}
            title={strings["feat.i18n.title"]}
            body={strings["feat.i18n.desc"]}
            link={`/match/${meta.id}`}
            ctaText="Explore 10 Languages"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="page-shell mt-auto border-t border-(--color-border) py-8 text-xs text-(--color-text-muted)">
        <p className="max-w-3xl leading-relaxed">
          {strings["app.privacyNote"]} {strings["app.simulatedBanner"]}
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  tag,
  title,
  body,
  link,
  ctaText,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tag: string;
  title: string;
  body: string;
  link: string;
  ctaText: string;
}) {
  return (
    <div className="feature-panel group flex flex-col justify-between rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-xs transition duration-200 hover:-translate-y-1 hover:border-(--color-accent)/40 hover:shadow-md">
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-xl bg-(--color-accent)/10 text-(--color-accent) transition group-hover:scale-105 group-hover:bg-(--color-accent) group-hover:text-white">
            <Icon size={18} />
          </span>
          <span className="rounded-md bg-(--color-surface-2) px-2 py-0.5 text-[10px] font-bold tracking-wider text-(--color-accent) uppercase">
            {tag}
          </span>
        </div>
        <h3 className="mb-2 text-base font-bold text-(--color-text)">{title}</h3>
        <p className="text-xs leading-relaxed text-(--color-text-muted)">{body}</p>
      </div>

      <div className="mt-5 pt-3 border-t border-(--color-border)/60">
        <Link
          href={link}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-(--color-accent) hover:underline"
        >
          {ctaText} <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
