import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { transformHabit } from "../utils/transform.js";

const router = Router();

// GET /api/habits
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const habits = await prisma.habit.findMany({
    where: { userId },
    include: { completions: true },
    orderBy: { createdAt: "asc" },
  });

  res.json(habits.map(transformHabit));
});

// POST /api/habits
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { name } = req.body as { name: unknown };

  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const habit = await prisma.habit.create({
    data: { userId, name },
    include: { completions: true },
  });

  res.status(201).json(transformHabit(habit));
});

// DELETE /api/habits/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  await prisma.habit.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/habits/:id/completions
router.post("/:id/completions", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { date, done } = req.body as { date: string; done: boolean };

  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }

  if (done) {
    await prisma.habitCompletion.upsert({
      where: { habitId_date: { habitId: id, date } },
      update: { done: true },
      create: { habitId: id, date, done: true },
    });
  } else {
    await prisma.habitCompletion.deleteMany({
      where: { habitId: id, date },
    });
  }

  const habit = await prisma.habit.findUniqueOrThrow({
    where: { id },
    include: { completions: true },
  });

  res.json(transformHabit(habit));
});

export default router;
