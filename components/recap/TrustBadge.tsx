"use client";

import { useState } from "react";
import { usePreferences } from "@/components/providers/preferences-provider";
import { t } from "@/lib/i18n";

export function TrustBadge({
  verified,
  total,
  source,
}: {
  verified: number;
  total: number;
  source: "ai" | "fallback";
}) {
  const { strings } = usePreferences();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-2) p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-(--color-success)">
          {source === "fallback"
            ? strings["recap.fallbackLabel"]
            : t(strings, "recap.trustBadge", { verified, total })}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-xs font-medium text-(--color-accent) underline underline-offset-2"
        >
          {strings["recap.whyTrust"]}
        </button>
      </div>
      {open && (
        <p className="mt-2 text-xs text-(--color-text-muted)">{strings["recap.whyTrustBody"]}</p>
      )}
    </div>
  );
}
