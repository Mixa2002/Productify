import { Router, Request, Response } from "express";
import prisma from "../prisma.js";
import { transformTask } from "../utils/transform.js";

const router = Router();

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// GET /api/tasks
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;

  if (!dateParam) {
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { completions: true },
      orderBy: { startTime: "asc" },
    });
    res.json(tasks.map(transformTask));
    return;
  }

  // Compute weekday name from the date string
  const dayIndex = new Date(dateParam + "T00:00:00").getDay();
  const dayName = DAY_NAMES[dayIndex];

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      OR: [
        { repeatable: false, date: dateParam },
        { repeatable: true, repeatDays: { has: dayName } },
      ],
    },
    include: { completions: true },
    orderBy: { startTime: "asc" },
  });

  res.json(tasks.map(transformTask));
});

// POST /api/tasks
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { title, date, startTime, duration, hardness, repeatable, repeatDays, source } = req.body as {
    title: unknown;
    date: unknown;
    startTime: unknown;
    duration: unknown;
    hardness: unknown;
    repeatable: unknown;
    repeatDays: unknown;
    source: unknown;
  };

  // Validation
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  if (startTime === undefined || startTime === null || typeof startTime !== "number") {
    res.status(400).json({ error: "startTime is required and must be a number" });
    return;
  }
  if (typeof duration !== "number" || duration < 5 || duration > 180) {
    res.status(400).json({ error: "Duration must be between 5 and 180 minutes" });
    return;
  }
  if (typeof hardness !== "number" || hardness < 1 || hardness > 5) {
    res.status(400).json({ error: "Hardness must be between 1 and 5" });
    return;
  }
  if (source !== "day" && source !== "week" && source !== "month") {
    res.status(400).json({ error: "Source must be 'day', 'week', or 'month'" });
    return;
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      date: typeof date === "string" ? date : "",
      startTime,
      duration,
      hardness,
      repeatable: repeatable === true,
      repeatDays: Array.isArray(repeatDays) ? repeatDays as string[] : [],
      source,
    },
    include: { completions: true },
  });

  res.status(201).json(transformTask(task));
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const allowedFields = ["title", "date", "startTime", "duration", "hardness", "repeatable", "repeatDays", "source"] as const;
  const data: Record<string, unknown> = {};
  const body = req.body as Record<string, unknown>;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { completions: true },
  });

  res.json(transformTask(task));
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await prisma.task.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/tasks/:id/completions
router.post("/:id/completions", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { date, done } = req.body as { date: string; done: boolean };

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (done) {
    await prisma.taskCompletion.upsert({
      where: { taskId_date: { taskId: id, date } },
      update: { done: true },
      create: { taskId: id, date, done: true },
    });
  } else {
    await prisma.taskCompletion.deleteMany({
      where: { taskId: id, date },
    });
  }

  const task = await prisma.task.findUniqueOrThrow({
    where: { id },
    include: { completions: true },
  });

  res.json(transformTask(task));
});

export default router;
