"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Ball, MatchMeta } from "./types";
import { SimulatedProvider, type SpeedMultiplier } from "./providers";

interface MatchRuntime {
  meta: MatchMeta;
  balls: Ball[];
  speed: SpeedMultiplier;
  paused: boolean;
  setSpeed: (s: SpeedMultiplier) => void;
  togglePause: () => void;
  restart: () => void;
  /** Jumps straight to a ball number without animating through it — used for join-late and Snap the TV. */
  jumpTo: (ballNumber: number) => void;
}

const MatchRuntimeContext = createContext<MatchRuntime | null>(null);

export function MatchRuntimeProvider({
  meta,
  startAtBall = 0,
  children,
}: {
  meta: MatchMeta;
  startAtBall?: number;
  children: React.ReactNode;
}) {
  const providerRef = useRef<SimulatedProvider | null>(null);
  if (!providerRef.current) providerRef.current = new SimulatedProvider();
  const provider = providerRef.current;

  const allBalls = useMemo(() => provider.getAllBalls(), [provider]);
  const [balls, setBalls] = useState<Ball[]>(() =>
    startAtBall > 0 ? allBalls.filter((b) => b.n <= startAtBall) : [],
  );
  const [speed, setSpeedState] = useState<SpeedMultiplier>(1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (startAtBall > 0) {
      // Fast-forward the provider's internal cursor so streaming resumes from here.
      provider.jumpCursorTo(startAtBall);
    }
    const unsubscribe = provider.stream((ball) => {
      setBalls((prev) => (prev.some((b) => b.n === ball.n) ? prev : [...prev, ball]));
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSpeed = (s: SpeedMultiplier) => {
    setSpeedState(s);
    provider.setSpeed(s);
  };

  const togglePause = () => {
    setPaused((p) => {
      const next = !p;
      if (next) provider.pause();
      else provider.resume();
      return next;
    });
  };

  const restart = () => {
    provider.restart();
    setBalls([]);
    setPaused(false);
  };

  const jumpTo = (ballNumber: number) => {
    provider.jumpCursorTo(ballNumber);
    setBalls(allBalls.filter((b) => b.n <= ballNumber));
  };

  const value = useMemo<MatchRuntime>(
    () => ({ meta, balls, speed, paused, setSpeed, togglePause, restart, jumpTo }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meta, balls, speed, paused],
  );

  return <MatchRuntimeContext.Provider value={value}>{children}</MatchRuntimeContext.Provider>;
}

export function useMatchRuntime(): MatchRuntime {
  const ctx = useContext(MatchRuntimeContext);
  if (!ctx) throw new Error("useMatchRuntime must be used within a MatchRuntimeProvider");
  return ctx;
}
