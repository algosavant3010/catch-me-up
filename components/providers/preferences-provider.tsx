"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  DEFAULT_LOCALE,
  getLocaleMeta,
  getStrings,
  isLocaleCode,
  type LocaleCode,
  type UiStrings,
} from "@/lib/i18n";
import { createPersistentStore } from "@/lib/utils/persistent-store";

export type FanMode = "beginner" | "pro" | "glance";
export type Theme = "light" | "dark";

interface StoredPreferences extends Record<string, unknown> {
  locale: LocaleCode;
  mode: FanMode;
  theme: Theme;
  onboardingComplete: boolean;
}

interface Preferences {
  locale: LocaleCode;
  mode: FanMode;
  theme: Theme;
  strings: UiStrings;
  setLocale: (l: LocaleCode) => void;
  setMode: (m: FanMode) => void;
  setTheme: (t: Theme) => void;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
}

const PreferencesContext = createContext<Preferences | null>(null);

const STORAGE_KEY = "catch-me-up:preferences:v1";

const DEFAULTS: StoredPreferences = {
  locale: DEFAULT_LOCALE,
  mode: "beginner",
  theme: "dark",
  onboardingComplete: false,
};

function systemPrefersLight(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
  );
}

function hasExplicitTheme(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return !!raw && "theme" in (JSON.parse(raw) as object);
  } catch {
    return false;
  }
}

const store = createPersistentStore<StoredPreferences>(STORAGE_KEY, DEFAULTS);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  // Apply the OS theme preference the first time this device has never saved one.
  const theme =
    stored.theme === DEFAULTS.theme && !hasExplicitTheme() && systemPrefersLight()
      ? "light"
      : stored.theme;
  const locale = isLocaleCode(stored.locale) ? stored.locale : DEFAULT_LOCALE;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = getLocaleMeta(locale).bcp47.split("-")[0];
  }, [locale]);

  const value = useMemo<Preferences>(
    () => ({
      locale,
      mode: stored.mode,
      theme,
      strings: getStrings(locale),
      setLocale: (l) => store.set({ locale: l }),
      setMode: (m) => store.set({ mode: m }),
      setTheme: (t) => store.set({ theme: t }),
      onboardingComplete: stored.onboardingComplete,
      completeOnboarding: () => store.set({ onboardingComplete: true }),
    }),
    [locale, stored.mode, stored.onboardingComplete, theme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Preferences {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}
