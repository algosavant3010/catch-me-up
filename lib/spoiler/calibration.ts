/**
 * Turns a set of calibration taps ("I saw it now") into a single delay
 * offset in seconds. Each tap pairs the wall-clock time our app emitted an
 * event with the wall-clock time the fan tapped after seeing the same
 * event on their own stream. Uses the median (not the mean) specifically
 * so a single accidental early/late tap ("outlier") can't skew the result.
 */
export interface CalibrationTap {
  emittedAt: number;
  tappedAt: number;
}

const MIN_PLAUSIBLE_SECONDS = 0;
const MAX_PLAUSIBLE_SECONDS = 60;

export function computeOffsetSeconds(taps: CalibrationTap[]): number {
  const plausible = taps
    .map((t) => (t.tappedAt - t.emittedAt) / 1000)
    .filter((s) => s >= MIN_PLAUSIBLE_SECONDS && s <= MAX_PLAUSIBLE_SECONDS);

  if (plausible.length === 0) return 0;

  const sorted = [...plausible].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  return Math.round(median);
}
