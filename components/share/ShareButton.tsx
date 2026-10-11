"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { usePreferences } from "@/components/providers/preferences-provider";
import { track } from "@/lib/analytics/track";

export function ShareButton({ ballNumber, title }: { ballNumber: number; title: string }) {
  const { strings } = usePreferences();
  const [status, setStatus] = useState<"idle" | "sharing" | "done" | "error">("idle");
  const imageUrl = `/api/og?ball=${ballNumber}`;

  async function share() {
    track("share_clicked");
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
      disabled={status === "sharing"}
      className="button-secondary"
    >
      {status === "done" ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Share2 size={16} aria-hidden="true" />
      )}
      {status === "done" ? "Shared" : status === "error" ? "Retry share" : strings["nav.share"]}
    </button>
  );
}
