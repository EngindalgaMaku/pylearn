// XP progression utilities
// Base: 100 XP for level 1 -> 2, then increases by growth factor per level

// Allow tuning via env with public visibility for client-side usage
// NEXT_PUBLIC_XP_BASE_XP_PER_LEVEL: number (default 100)
// NEXT_PUBLIC_XP_GROWTH_FACTOR: number (default 1.15)
function parseNumberEnv(key: string, fallback: number): number {
  const raw = (process.env as any)?.[key]
  if (raw == null) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return n
}

const RAW_BASE = parseNumberEnv("NEXT_PUBLIC_XP_BASE_XP_PER_LEVEL", 100)
const RAW_GROWTH = parseNumberEnv("NEXT_PUBLIC_XP_GROWTH_FACTOR", 1.15)

// Clamp to safe ranges
export const BASE_XP_PER_LEVEL = Math.max(10, Math.round(RAW_BASE))
export const GROWTH_FACTOR = Math.min(3, Math.max(1, RAW_GROWTH))
export const ROUND_TO = 5; // round requirements to nearest 5 for nice numbers

// XP required to advance from `level` to `level + 1`
export function xpForLevel(level: number): number {
  if (level <= 1) return BASE_XP_PER_LEVEL;
  const raw = BASE_XP_PER_LEVEL * Math.pow(GROWTH_FACTOR, level - 1);
  // Round to nearest ROUND_TO and enforce minimum BASE_XP_PER_LEVEL
  const rounded = Math.max(
    BASE_XP_PER_LEVEL,
    Math.round(raw / ROUND_TO) * ROUND_TO
  );
  return rounded;
}

// Total cumulative XP required to reach the start of `level`
// e.g., totalXPForLevel(1) = 0; totalXPForLevel(2) = xpForLevel(1)
export function totalXPForLevel(level: number): number {
  if (level <= 1) return 0;
  let sum = 0;
  for (let l = 1; l < level; l++) {
    sum += xpForLevel(l);
  }
  return sum;
}

// Determine the current level for a given total XP
export function getLevelFromXP(totalXP: number): number {
  if (!Number.isFinite(totalXP) || totalXP <= 0) return 1;
  let level = 1;
  let remaining = totalXP;
  while (true) {
    const need = xpForLevel(level);
    if (remaining < need) break;
    remaining -= need;
    level += 1;
    // Safety cap to avoid infinite loops in case of weird data
    if (level > 1000) break;
  }
  return level;
}

// Get progress within current level
export function getXPProgress(totalXP: number): {
  level: number;
  xpIntoLevel: number;
  xpNeededThisLevel: number;
  xpToNextLevel: number;
  progressPercent: number; // 0..100
} {
  const level = getLevelFromXP(totalXP);
  const into = Math.max(0, totalXP - totalXPForLevel(level));
  const need = xpForLevel(level);
  const toNext = Math.max(0, need - into);
  const pct = need > 0 ? (into / need) * 100 : 0;
  return {
    level,
    xpIntoLevel: into,
    xpNeededThisLevel: need,
    xpToNextLevel: toNext,
    progressPercent: Math.min(100, Math.max(0, Math.round(pct)))
  };
}
