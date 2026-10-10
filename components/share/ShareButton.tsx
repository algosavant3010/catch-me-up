"use client";

import { useState } from "react";
import { usePreferences } from "@/components/providers/preferences-provider";

export function ShareButton({ ballNumber, title }: { ballNumber: number; title: string }) {
  const { strings } = usePreferences();
  const [status, setStatus] = useState<"idle" | "sharing" | "done" | "error">("idle");
  const imageUrl = `/api/og?ball=${ballNumber}`;

  async function share() {
    setStatus("sharing");
    const shareUrl = `${window.location.origin}${window.location.pathname}?ball=${ballNumber}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        setStatus("done");
        return;
      }
      // Canvas fallback: draw the OG image onto a canvas and trigger a download.
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `catch-me-up-b${ballNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="rounded-full border border-(--color-border) bg-(--color-surface-2) px-3 py-1.5 text-xs font-medium"
    >
      {status === "done" ? "✓ Shared" : strings["nav.share"]}
    </button>
  );
}
