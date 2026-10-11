"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, Square } from "lucide-react";
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
    <div className="flex flex-wrap items-center gap-2 border-t border-(--color-border) pt-4 text-xs">
      {state === "idle" && (
        <button type="button" onClick={play} className="button-primary">
          <Headphones size={16} aria-hidden="true" />
          {strings["listen.play"]}
        </button>
      )}
      {state === "playing" && (
        <button type="button" onClick={pause} className="button-secondary">
          <Pause size={16} aria-hidden="true" />
          {strings["listen.pause"]}
        </button>
      )}
      {state === "paused" && (
        <button type="button" onClick={resume} className="button-secondary">
          <Play size={16} aria-hidden="true" />
          {strings["listen.play"]}
        </button>
      )}
      {state !== "idle" && (
        <button type="button" onClick={stop} className="button-secondary">
          <Square size={16} aria-hidden="true" />
          {strings["listen.stop"]}
        </button>
      )}
    </div>
  );
}
