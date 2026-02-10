export const OPENCRITIC_CAROUSEL_TTL_SECONDS = 60 * 60 * 24; // 24 hours
export const OPENCRITIC_DETAIL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const OPENCRITIC_JITTER_SECONDS = 60 * 60; // ±1 hour

export function jitterTtl(baseSeconds: number, maxJitterSeconds: number): number {
  if (!Number.isFinite(baseSeconds) || baseSeconds <= 0) {
    return baseSeconds;
  }

  const jitter = maxJitterSeconds
    ? Math.floor(Math.random() * (maxJitterSeconds * 2 + 1)) - maxJitterSeconds
    : 0;

  const value = Math.max(1, baseSeconds + jitter);
  return value;
}
