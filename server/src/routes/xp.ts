import { Router, Request, Response } from "express";
import prisma from "../prisma.js";

const router = Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_SOURCES = new Set([
  "task_complete",
  "task_uncomplete",
  "habit_complete",
  "habit_uncomplete",
  "daily_all_tasks",
  "daily_all_tasks_lost",
  "daily_all_habits",
  "daily_all_habits_lost",
  "perfect_day",
  "perfect_day_lost",
]);

// --- XP calculation helpers (mirroring frontend src/utils/xp.ts) ---

function getTotalXP(events: { amount: number }[]): number {
  const sum = events.reduce((acc, e) => acc + e.amount, 0);
  return Math.max(0, sum);
}

function getLevelFromXP(totalXP: number): number {
  let level = 1;
  while (Math.floor(100 * Math.pow(level + 1, 1.5)) <= totalXP) {
    level++;
  }
  return level;
}

function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

function getCurrentLevelProgress(totalXP: number): {
  level: number;
  currentXP: number;
  xpNeeded: number;
  progress: number;
} {
  const level = getLevelFromXP(totalXP);
  const levelStart = level === 1 ? 0 : getXPForLevel(level);
  const levelEnd = getXPForLevel(level + 1);
  const currentXP = totalXP - levelStart;
  const xpNeeded = levelEnd - levelStart;
  const progress = xpNeeded > 0 ? currentXP / xpNeeded : 0;
  return { level, currentXP, xpNeeded, progress };
}

interface UnlockTier {
  level: number;
  habitCap: number;
  taskCap: number;
  description: string;
}

const UNLOCK_TIERS: UnlockTier[] = [
  { level: 1, habitCap: 5, taskCap: 8, description: "Starting" },
  { level: 5, habitCap: 5, taskCap: 9, description: "+1 Task Slot" },
  { level: 10, habitCap: 6, taskCap: 9, description: "+1 Habit Slot" },
  { level: 15, habitCap: 6, taskCap: 10, description: "+1 Task Slot" },
  { level: 20, habitCap: 7, taskCap: 10, description: "+1 Habit Slot" },
  { level: 30, habitCap: 7, taskCap: 12, description: "+2 Task Slots" },
  { level: 40, habitCap: 8, taskCap: 12, description: "+1 Habit Slot" },
  { level: 50, habitCap: 8, taskCap: 14, description: "+2 Task Slots" },
];

function getCapsForLevel(level: number): { habitCap: number; taskCap: number } {
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

function getNextUnlock(level: number): UnlockTier | null {
  for (const tier of UNLOCK_TIERS) {
    if (tier.level > level) {
      return tier;
    }
  }
  return null;
}

// --- Routes ---

// GET /api/xp/events
router.get("/events", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const events = await prisma.xpEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      date: true,
      source: true,
      sourceId: true,
      amount: true,
      createdAt: true,
    },
  });

  res.json(
    events.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    }))
  );
});

// POST /api/xp/events
router.post("/events", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { date, source, sourceId, amount } = req.body as {
    date: unknown;
    source: unknown;
    sourceId: unknown;
    amount: unknown;
  };

  if (typeof date !== "string" || !DATE_RE.test(date)) {
    res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    return;
  }
  if (typeof source !== "string" || !VALID_SOURCES.has(source)) {
    res.status(400).json({ error: "Invalid source type" });
    return;
  }
  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    res.status(400).json({ error: "Amount must be an integer" });
    return;
  }

  const resolvedSourceId = typeof sourceId === "string" ? sourceId : "";

  const event = await prisma.xpEvent.create({
    data: {
      userId,
      date,
      source,
      sourceId: resolvedSourceId,
      amount,
    },
    select: {
      id: true,
      date: true,
      source: true,
      sourceId: true,
      amount: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    ...event,
    createdAt: event.createdAt.toISOString(),
  });
});

// GET /api/xp/summary
router.get("/summary", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const events = await prisma.xpEvent.findMany({
    where: { userId },
    select: { amount: true },
  });

  const totalXp = getTotalXP(events);
  const level = getLevelFromXP(totalXp);
  const currentLevelProgress = getCurrentLevelProgress(totalXp);
  const caps = getCapsForLevel(level);
  const nextUnlock = getNextUnlock(level);

  res.json({ totalXp, level, currentLevelProgress, caps, nextUnlock });
});

// DELETE /api/xp/events
router.delete("/events", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const sourceId = typeof req.query.sourceId === "string" ? req.query.sourceId : "";

  if (!sourceId) {
    res.status(400).json({ error: "sourceId query parameter is required" });
    return;
  }

  await prisma.xpEvent.deleteMany({
    where: { userId, sourceId },
  });

  res.status(204).send();
});

export default router;
