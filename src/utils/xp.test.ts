import { describe, it, expect } from 'vitest';
import {
  calculateTaskXP,
  calculateHabitXP,
  getLevelFromXP,
  getXPForLevel,
  getCurrentLevelProgress,
  getTotalXP,
  getCapsForLevel,
  getNextUnlock,
  getUnlockTiers,
} from './xp.ts';
import { getTasksForDate } from './index.ts';
import type { Task, XpEvent } from '../types/index.ts';

describe('calculateTaskXP', () => {
  it('calculates XP for hardness 1 and 15 min', () => {
    expect(calculateTaskXP(1, 15)).toBe(14); // (1*8)+(3*2)
  });

  it('calculates XP for hardness 5 and 60 min', () => {
    expect(calculateTaskXP(5, 60)).toBe(64); // (5*8)+(12*2)
  });

  it('handles minimum values', () => {
    expect(calculateTaskXP(1, 5)).toBe(10); // (1*8)+(1*2)
  });

  it('floors duration to 5-min blocks', () => {
    expect(calculateTaskXP(1, 7)).toBe(10); // 7/5 = 1.4 → floor(1.4) = 1 → (8)+(1*2)
  });

  it('handles zero duration', () => {
    expect(calculateTaskXP(3, 0)).toBe(24); // (3*8)+(0*2)
  });

  it('calculates XP for hardness 5 and 30 min', () => {
    expect(calculateTaskXP(5, 30)).toBe(52); // (5*8)+(6*2)
  });

  it('negative amount for uncomplete equals negated XP', () => {
    expect(-calculateTaskXP(5, 30)).toBe(-52);
  });
});

describe('calculateHabitXP', () => {
  it('returns 0 for streak of 0', () => {
    expect(calculateHabitXP(0)).toBe(0);
  });

  it('returns 1 for streak of 1', () => {
    expect(calculateHabitXP(1)).toBe(1); // floor(1 * 1.5)
  });

  it('returns 7 for streak of 5', () => {
    expect(calculateHabitXP(5)).toBe(7); // floor(5 * 1.5)
  });

  it('returns 15 for streak of 10', () => {
    expect(calculateHabitXP(10)).toBe(15); // floor(10 * 1.5)
  });

  it('caps at streak of 30', () => {
    expect(calculateHabitXP(30)).toBe(45); // floor(30 * 1.5)
    expect(calculateHabitXP(100)).toBe(45); // capped at 30
  });
});

describe('getLevelFromXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it('returns level 1 just below level 2 threshold', () => {
    const level2Threshold = getXPForLevel(2); // floor(100 * 2^1.5) = 282
    expect(getLevelFromXP(level2Threshold - 1)).toBe(1);
  });

  it('returns level 2 at exactly level 2 threshold', () => {
    const level2Threshold = getXPForLevel(2); // 282
    expect(getLevelFromXP(level2Threshold)).toBe(2);
  });

  it('returns level 10 at level 10 threshold', () => {
    const level10Threshold = getXPForLevel(10); // floor(100 * 10^1.5) = 3162
    expect(getLevelFromXP(level10Threshold)).toBe(10);
  });

  it('handles large XP values', () => {
    const level50Threshold = getXPForLevel(50);
    expect(getLevelFromXP(level50Threshold)).toBe(50);
  });
});

describe('getCurrentLevelProgress', () => {
  it('returns level 1 with 0 XP', () => {
    const result = getCurrentLevelProgress(0);
    expect(result.level).toBe(1);
    expect(result.currentXP).toBe(0); // Level 1 starts at 0 XP
    expect(result.xpNeeded).toBe(282); // getXPForLevel(2) - 0
    expect(result.progress).toBe(0);
  });

  it('returns correct progress mid-level', () => {
    const level2Start = getXPForLevel(2); // 282
    const level3Start = getXPForLevel(3); // 519
    const midpoint = level2Start + Math.floor((level3Start - level2Start) / 2);
    const result = getCurrentLevelProgress(midpoint);
    expect(result.level).toBe(2);
    expect(result.currentXP).toBe(midpoint - level2Start);
    expect(result.xpNeeded).toBe(level3Start - level2Start);
    expect(result.progress).toBeGreaterThan(0.4);
    expect(result.progress).toBeLessThan(0.6);
  });

  it('returns progress near 0 at level boundary', () => {
    const level5Start = getXPForLevel(5);
    const result = getCurrentLevelProgress(level5Start);
    expect(result.level).toBe(5);
    expect(result.currentXP).toBe(0);
    expect(result.progress).toBe(0);
  });
});

describe('getTotalXP', () => {
  it('returns 0 for empty events', () => {
    expect(getTotalXP([])).toBe(0);
  });

  it('sums positive events', () => {
    const events: XpEvent[] = [
      { id: '1', date: '2026-01-01', source: 'task_complete', sourceId: 'a', amount: 10, createdAt: '' },
      { id: '2', date: '2026-01-01', source: 'task_complete', sourceId: 'b', amount: 20, createdAt: '' },
    ];
    expect(getTotalXP(events)).toBe(30);
  });

  it('handles negative events', () => {
    const events: XpEvent[] = [
      { id: '1', date: '2026-01-01', source: 'task_complete', sourceId: 'a', amount: 10, createdAt: '' },
      { id: '2', date: '2026-01-01', source: 'task_uncomplete', sourceId: 'a', amount: -10, createdAt: '' },
    ];
    expect(getTotalXP(events)).toBe(0);
  });

  it('floors at 0', () => {
    const events: XpEvent[] = [
      { id: '1', date: '2026-01-01', source: 'task_uncomplete', sourceId: 'a', amount: -50, createdAt: '' },
    ];
    expect(getTotalXP(events)).toBe(0);
  });
});

describe('getCapsForLevel', () => {
  it('returns starting caps at level 1', () => {
    expect(getCapsForLevel(1)).toEqual({ habitCap: 5, taskCap: 8 });
  });

  it('returns level 5 caps', () => {
    expect(getCapsForLevel(5)).toEqual({ habitCap: 5, taskCap: 9 });
  });

  it('returns level 10 caps at level 12', () => {
    expect(getCapsForLevel(12)).toEqual({ habitCap: 6, taskCap: 9 });
  });

  it('returns final caps at level 50+', () => {
    expect(getCapsForLevel(50)).toEqual({ habitCap: 8, taskCap: 14 });
    expect(getCapsForLevel(99)).toEqual({ habitCap: 8, taskCap: 14 });
  });
});

describe('getNextUnlock', () => {
  it('returns level 5 tier for level 1', () => {
    const next = getNextUnlock(1);
    expect(next).not.toBeNull();
    expect(next!.level).toBe(5);
  });

  it('returns level 10 tier for level 5', () => {
    const next = getNextUnlock(5);
    expect(next).not.toBeNull();
    expect(next!.level).toBe(10);
  });

  it('returns null when all unlocked', () => {
    expect(getNextUnlock(50)).toBeNull();
    expect(getNextUnlock(99)).toBeNull();
  });
});

describe('getUnlockTiers', () => {
  it('returns 8 tiers', () => {
    expect(getUnlockTiers()).toHaveLength(8);
  });

  it('tiers are in ascending level order', () => {
    const tiers = getUnlockTiers();
    for (let i = 1; i < tiers.length; i++) {
      expect(tiers[i].level).toBeGreaterThan(tiers[i - 1].level);
    }
  });
});

describe('getTasksForDate', () => {
  const makeTask = (overrides: Partial<Task>): Task => ({
    id: 'test-id',
    title: 'Test Task',
    date: '2026-03-21',
    startTime: 540,
    duration: 30,
    hardness: 5,
    repeatable: false,
    repeatDays: [],
    source: 'day',
    completions: {},
    createdAt: '2026-03-21T00:00:00Z',
    updatedAt: '2026-03-21T00:00:00Z',
    ...overrides,
  });

  it('returns non-repeatable tasks matching the date', () => {
    const tasks = [
      makeTask({ id: '1', date: '2026-03-21' }),
      makeTask({ id: '2', date: '2026-03-22' }),
    ];
    // 2026-03-21 is a Saturday
    const result = getTasksForDate(tasks, new Date('2026-03-21T00:00:00'));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns repeatable tasks matching the day of week', () => {
    const tasks = [
      makeTask({ id: '1', repeatable: true, repeatDays: ['Sat'], date: '2026-01-01' }),
      makeTask({ id: '2', repeatable: true, repeatDays: ['Mon'], date: '2026-01-01' }),
    ];
    // 2026-03-21 is a Saturday
    const result = getTasksForDate(tasks, new Date('2026-03-21T00:00:00'));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns empty array when no tasks match', () => {
    const tasks = [makeTask({ id: '1', date: '2026-03-22' })];
    const result = getTasksForDate(tasks, new Date('2026-03-21T00:00:00'));
    expect(result).toHaveLength(0);
  });
});
