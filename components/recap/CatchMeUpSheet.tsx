"use client";

import { useEffect } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useRecapStream } from "@/lib/recap/use-recap-stream";
import { TrustBadge } from "./TrustBadge";
import { RefChip } from "./RefChip";
import { ListenControls } from "./ListenControls";

export function CatchMeUpSheet({
  open,
  onClose,
  from,
  to,
}: {
  open: boolean;
  onClose: () => void;
  from: number;
  to: number;
}) {
  const { locale, mode, strings } = usePreferences();
  const { status, headline, trust, lines, errorMessage, start, reset } = useRecapStream();

  useEffect(() => {
    if (open) start({ from, to, locale, mode });
    else reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, from, to, locale, mode]);

  const fullText = [headline, ...lines.map((l) => l.text)].filter(Boolean).join(". ");

  return (
    <Sheet open={open} onClose={onClose} title={strings["recap.title"]}>
      {(status === "idle" || status === "loading") && (
        <div role="status" className="space-y-4">
          <p className="text-sm text-(--color-text-muted)">{strings["recap.loading"]}</p>
          <div aria-hidden="true" className="animate-pulse space-y-3">
            <div className="h-6 w-3/4 rounded bg-(--color-surface-2)" />
            <div className="h-16 rounded bg-(--color-surface-2)" />
            <div className="h-16 rounded bg-(--color-surface-2)" />
          </div>
        </div>
      )}
      {status === "error" && (
        <p role="alert" className="text-sm text-(--color-danger)">
          {errorMessage ?? strings["state.error"]}
        </p>
      )}

      {(status === "streaming" || status === "done") && (
        <div className="flex flex-col gap-4">
          {headline && <h3 className="text-xl font-bold">{headline}</h3>}
          {trust && (
            <TrustBadge verified={trust.verified} total={trust.total} source={trust.source} />
          )}
          <div className="flex flex-col gap-3">
            {lines.map((line, i) => (
              <div key={i} className="border-l-2 border-(--color-border) py-2 pl-4">
                <p className="text-sm leading-relaxed">{line.text}</p>
                {line.refs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {line.refs.map((ref) => (
                      <RefChip key={ref} ballNumber={ref} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {status === "done" && fullText && <ListenControls text={fullText} />}
        </div>
      )}
    </Sheet>
  );
}
