"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Settings2, Zap } from "lucide-react";
import type { MatchMeta } from "@/lib/match/types";
import { MatchRuntimeProvider } from "@/lib/match/match-context";
import { usePreferences } from "@/components/providers/preferences-provider";
import { Scoreboard } from "@/components/scoreboard/Scoreboard";
import { WinProbChart } from "@/components/scoreboard/WinProbChart";
import { TensionMeter } from "@/components/scoreboard/TensionMeter";
import { SpeedControls } from "@/components/scoreboard/SpeedControls";
import { ActionBar } from "@/components/match/ActionBar";
import { AlertToasts } from "@/components/alerts/AlertToasts";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { ChatPulsePanel } from "@/components/chat/ChatPulsePanel";
import { CallTheNextOverPanel } from "@/components/game/CallTheNextOverPanel";
import { RoomPanel } from "@/components/game/RoomPanel";
import { FantasyPulsePanel } from "@/components/game/FantasyPulsePanel";
import { SettleTheBanterPanel } from "@/components/game/SettleTheBanterPanel";
import { WhatIfSimulatorPanel } from "@/components/game/WhatIfSimulatorPanel";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export function MatchExperience({ meta, startAtBall }: { meta: MatchMeta; startAtBall: number }) {
  return (
    <MatchRuntimeProvider meta={meta} startAtBall={startAtBall}>
      <AlertToasts />
      <MatchLayout />
    </MatchRuntimeProvider>
  );
}

function MatchLayout() {
  const { strings } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="page-shell flex flex-1 flex-col pb-28 sm:pb-12">
      <header className="flex items-center justify-between gap-4 border-b border-(--color-border) py-4 sm:py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
          aria-label="Catch Me Up home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-(--color-accent)/15 text-(--color-accent)">
            <Zap className="size-5" aria-hidden="true" />
          </span>
          <span className="font-extrabold tracking-tight">CATCH ME UP</span>
          <span className="hidden rounded-full border border-(--color-border) bg-(--color-surface-2) px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-(--color-text-muted) uppercase sm:inline">
            {strings["landing.matchCentre"]}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label={strings["nav.settings"]}
            title={strings["nav.settings"]}
            className="icon-button size-9 rounded-xl border border-(--color-border) bg-(--color-surface-2)/70"
          >
            <Settings2 aria-hidden="true" size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 text-xs font-medium text-(--color-text-muted)">
        <p className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-(--color-accent)" />
          {strings["app.simulatedBanner"]}
        </p>
        <span className="inline-flex items-center gap-1 rounded-md bg-(--color-surface-2) px-2.5 py-1 font-bold tracking-wider text-(--color-text) uppercase">
          <ArrowUpRight size={13} aria-hidden="true" className="text-(--color-accent)" /> T20 /
          FINAL CHASE
        </span>
      </div>

      <h1 className="sr-only">{strings["landing.matchCentre"]}</h1>

      <div className="match-grid">
        <Scoreboard />
        <div className="flex min-w-0 flex-col justify-between gap-4">
          <WinProbChart />
          <TensionMeter />
          <SpeedControls />
        </div>
      </div>

      <div className="mt-10 mb-5 flex items-center justify-between border-t border-(--color-border) pt-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-(--color-text)">{strings["beyond.title"]}</h2>
          <p className="text-xs text-(--color-text-muted)">{strings["beyond.subtitle"]}</p>
        </div>
        <span className="eyebrow">{strings["beyond.tag"]}</span>
      </div>

      <div className="match-tools">
        <FantasyPulsePanel />
        <WhatIfSimulatorPanel />
        <SettleTheBanterPanel />
        <CallTheNextOverPanel />
        <RoomPanel />
        <ChatPulsePanel />
      </div>

      <ActionBar />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
