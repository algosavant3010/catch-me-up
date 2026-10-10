"use client";

import { useRef, useState } from "react";
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
    <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <h3 className="mb-1 font-semibold">Snap the TV</h3>
      <p className="mb-3 text-xs text-(--color-text-muted)">
        Photograph your TV or another app&apos;s scoreboard and we&apos;ll sync this view to match.
        Processed in memory only — never stored.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        capture="environment"
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
        className="rounded-(--radius-md) bg-(--color-accent) px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {status === "processing" ? "Reading…" : "Upload or photograph"}
      </button>
      {message && (
        <p
          className={`mt-2 text-xs ${status === "retry" ? "text-(--color-danger)" : "text-(--color-success)"}`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
