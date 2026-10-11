"use client";

import { useRef, useState } from "react";
import { ScanLine, Upload, LoaderCircle } from "lucide-react";
import { useMatchRuntime } from "@/lib/match/match-context";
import { track } from "@/lib/analytics/track";

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_DIMENSION = 1024;

async function resizeAndCompress(file: File): Promise<{ base64: string; mimeType: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.8),
  );
  const buffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return { base64, mimeType: "image/jpeg" };
}

export function SnapTheTV() {
  const { jumpTo } = useMatchRuntime();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "retry">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      setStatus("retry");
      setMessage("That image is over 4MB — try a smaller photo.");
      return;
    }
    setStatus("processing");
    setMessage(null);
    track("vision_sync_attempted");
    try {
      const { base64, mimeType } = await resizeAndCompress(file);
      const res = await fetch("/api/vision-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (data.readable && data.matchedBallNumber) {
        jumpTo(data.matchedBallNumber);
        track("vision_sync_succeeded");
        setStatus("success");
        setMessage(`Synced to ball ${data.matchedBallNumber}.`);
      } else {
        setStatus("retry");
        setMessage(data.message ?? "Couldn't read that — try again.");
      }
    } catch {
      setStatus("retry");
      setMessage("Something went wrong reading that image. Try again.");
    }
  }

  return (
    <section className="feature-panel">
      <h3 className="section-heading">
        <ScanLine aria-hidden="true" />
        Snap the TV
      </h3>
      <p className="mb-4 text-xs text-(--color-text-muted)">
        Photograph your TV or another app&apos;s scoreboard and we&apos;ll sync this view to match.
        Processed in memory only — never stored.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        capture="environment"
        aria-label="Scoreboard photograph"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "processing"}
        className="group flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-(--color-border) bg-(--color-surface-2)/40 p-6 text-center transition hover:border-(--color-accent) hover:bg-(--color-surface-2)"
      >
        {status === "processing" ? (
          <LoaderCircle
            className="animate-spin text-(--color-accent)"
            size={24}
            aria-hidden="true"
          />
        ) : (
          <Upload
            size={24}
            aria-hidden="true"
            className="text-(--color-accent) transition group-hover:scale-110"
          />
        )}
        <span className="text-sm font-semibold">
          {status === "processing" ? "Reading…" : "Upload or photograph"}
        </span>
      </button>
      <p className="mt-2 text-center text-xs text-(--color-text-muted)">
        JPG, PNG or WebP / up to 4 MB
      </p>
      {message && (
        <p
          role="status"
          className={`mt-2 rounded-lg p-2.5 text-center text-xs font-semibold ${
            status === "retry"
              ? "bg-rose-500/10 text-(--color-danger)"
              : "bg-emerald-500/10 text-(--color-success)"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
