import type { XpEvent, UnlockTier } from '../types/index.ts';

export function calculateTaskXP(hardness: number, duration: number): number {
  return (hardness * 8) + (Math.floor(duration / 5) * 2);
}

export function calculateHabitXP(currentStreak: number): number {
  return Math.floor(Math.min(currentStreak, 30) * 1.5);
}

export function getTotalXP(xpEvents: XpEvent[]): number {
  const sum = xpEvents.reduce((acc, e) => acc + e.amount, 0);
  return Math.max(0, sum);
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  while (Math.floor(100 * Math.pow(level + 1, 1.5)) <= totalXP) {
    level++;
  }
  return level;
}

export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function getCurrentLevelProgress(totalXP: number): {
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
} {
  const level = getLevelFromXP(totalXP);
  // Level 1 starts at 0 XP (special case since getXPForLevel(1) = 100)
  const levelStart = level === 1 ? 0 : getXPForLevel(level);
  const levelEnd = getXPForLevel(level + 1);
  const currentXP = totalXP - levelStart;
  const xpNeeded = levelEnd - levelStart;
  const progress = xpNeeded > 0 ? currentXP / xpNeeded : 0;
  return { level, currentXP, xpNeeded, progress };
}

const UNLOCK_TIERS: UnlockTier[] = [
  { level: 1,  habitCap: 5, taskCap: 8,  description: 'Starting' },
  { level: 5,  habitCap: 5, taskCap: 9,  description: '+1 Task Slot' },
  { level: 10, habitCap: 6, taskCap: 9,  description: '+1 Habit Slot' },
  { level: 15, habitCap: 6, taskCap: 10, description: '+1 Task Slot' },
  { level: 20, habitCap: 7, taskCap: 10, description: '+1 Habit Slot' },
  { level: 30, habitCap: 7, taskCap: 12, description: '+2 Task Slots' },
  { level: 40, habitCap: 8, taskCap: 12, description: '+1 Habit Slot' },
  { level: 50, habitCap: 8, taskCap: 14, description: '+2 Task Slots' },
];

export function getUnlockTiers(): UnlockTier[] {
  return UNLOCK_TIERS;
}

export function getCapsForLevel(level: number): { habitCap: number; taskCap: number } {
  let caps = { habitCap: UNLOCK_TIERS[0].habitCap, taskCap: UNLOCK_TIERS[0].taskCap };
  for (const tier of UNLOCK_TIERS) {
    if (tier.level <= level) {
      caps = { habitCap: tier.habitCap, taskCap: tier.taskCap };
    } else {
      break;
    }
  }
  return caps;
}

export function getNextUnlock(level: number): UnlockTier | null {
  for (const tier of UNLOCK_TIERS) {
    if (tier.level > level) {
      return tier;
    }
  }
  return null;
}
