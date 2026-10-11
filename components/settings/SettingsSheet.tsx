"use client";

import { useSyncExternalStore } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { usePreferences } from "@/components/providers/preferences-provider";
import { LOCALES } from "@/lib/i18n";
import type { FanMode } from "@/components/providers/preferences-provider";
import { alertsStore } from "@/lib/alerts/alerts-store";
import { analyticsOptOutStore } from "@/lib/analytics/track";
import { SpoilerShieldPanel } from "@/components/spoiler/SpoilerShieldPanel";

const MODES: FanMode[] = ["beginner", "pro", "glance"];

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, setLocale, mode, setMode, theme, setTheme, strings } = usePreferences();
  const alertPrefs = useSyncExternalStore(
    alertsStore.subscribe,
    alertsStore.getSnapshot,
    alertsStore.getServerSnapshot,
  );
  const analyticsPrefs = useSyncExternalStore(
    analyticsOptOutStore.subscribe,
    analyticsOptOutStore.getSnapshot,
    analyticsOptOutStore.getServerSnapshot,
  );

  async function toggleNotifications() {
    if (!alertPrefs.notificationsOptIn && typeof Notification !== "undefined") {
      const perm = await Notification.requestPermission();
      alertsStore.set({ notificationsOptIn: perm === "granted" });
    } else {
      alertsStore.set({ notificationsOptIn: false });
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={strings["nav.settings"]}>
      <div className="flex flex-col gap-5 text-sm">
        <div className="settings-section">
          <p className="mb-2 font-medium">{strings["onboarding.step1Title"]}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                aria-pressed={locale === l.code}
                className={`rounded-(--radius-md) border border-(--color-border) px-3 py-2 text-sm ${locale === l.code ? "bg-(--color-accent) text-white" : "bg-(--color-surface-2) hover:border-(--color-text-muted)"}`}
              >
                {l.nativeLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <p className="mb-2 font-medium">{strings["onboarding.step2Title"]}</p>
          <div className="flex gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`flex-1 rounded-(--radius-md) border border-(--color-border) px-3 py-2 ${mode === m ? "bg-(--color-accent) text-white" : "bg-(--color-surface-2)"}`}
              >
                {strings[`mode.${m}` as const]}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <p className="mb-2 font-medium">Theme</p>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              className={`flex-1 rounded-(--radius-md) border border-(--color-border) px-3 py-2 ${theme === "light" ? "bg-(--color-accent) text-white" : "bg-(--color-surface-2)"}`}
            >
              {strings["theme.light"]}
            </button>
            <button
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={`flex-1 rounded-(--radius-md) border border-(--color-border) px-3 py-2 ${theme === "dark" ? "bg-(--color-accent) text-white" : "bg-(--color-surface-2)"}`}
            >
              {strings["theme.dark"]}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <p className="mb-2 font-medium">Alerts</p>
          <label className="setting-row">
            <span>Browser notifications</span>
            <input
              type="checkbox"
              checked={alertPrefs.notificationsOptIn}
              onChange={toggleNotifications}
            />
          </label>
          <label className="setting-row">
            <span>Vibration</span>
            <input
              type="checkbox"
              checked={alertPrefs.vibrationOptIn}
              onChange={(e) => alertsStore.set({ vibrationOptIn: e.target.checked })}
            />
          </label>
        </div>

        <SpoilerShieldPanel />

        <label className="setting-row">
          <span>Share anonymous usage counts</span>
          <input
            type="checkbox"
            checked={!analyticsPrefs.optedOut}
            onChange={(e) => analyticsOptOutStore.set({ optedOut: !e.target.checked })}
          />
        </label>

        <p className="text-xs text-(--color-text-muted)">{strings["app.privacyNote"]}</p>
      </div>
    </Sheet>
  );
}
