"use client";

import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/components/providers/preferences-provider";
import { getLocaleMeta } from "@/lib/i18n";

export function ListenControls({ text }: { text: string }) {
  const { locale, strings } = usePreferences();
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [available] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (!available) {
    return <p className="text-xs text-(--color-text-muted)">{strings["listen.unavailable"]}</p>;
  }

  const play = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLocaleMeta(locale).bcp47;
    utterance.onend = () => setState("idle");
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setState("playing");
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setState("paused");
  };

  const resume = () => {
    window.speechSynthesis.resume();
    setState("playing");
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setState("idle");
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {state === "idle" && (
        <button
          type="button"
          onClick={play}
          className="rounded-full bg-(--color-accent) px-3 py-1 font-medium text-white"
        >
          {strings["listen.play"]}
        </button>
      )}
      {state === "playing" && (
        <button
          type="button"
          onClick={pause}
          className="rounded-full border border-(--color-border) px-3 py-1 font-medium"
        >
          {strings["listen.pause"]}
        </button>
      )}
      {state === "paused" && (
        <button
          type="button"
          onClick={resume}
          className="rounded-full border border-(--color-border) px-3 py-1 font-medium"
        >
          {strings["listen.play"]}
        </button>
      )}
      {state !== "idle" && (
        <button
          type="button"
          onClick={stop}
          className="rounded-full border border-(--color-border) px-3 py-1 font-medium"
        >
          {strings["listen.stop"]}
        </button>
      )}
    </div>
  );
}
