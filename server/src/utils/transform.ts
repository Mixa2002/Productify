import type { Task, TaskCompletion, Habit, HabitCompletion } from "../generated/prisma/client.js";

type TaskWithCompletions = Task & { completions: TaskCompletion[] };
type HabitWithCompletions = Habit & { completions: HabitCompletion[] };

function completionsToRecord(completions: { date: string; done: boolean }[]): Record<string, boolean> {
  const record: Record<string, boolean> = {};
  for (const c of completions) {
    record[c.date] = c.done;
  }
  return record;
}

export function transformTask(task: TaskWithCompletions) {
  return {
    id: task.id,
    title: task.title,
    date: task.date,
    startTime: task.startTime,
    duration: task.duration,
    hardness: task.hardness,
    repeatable: task.repeatable,
    repeatDays: task.repeatDays,
    source: task.source as "day" | "week" | "month",
    completions: completionsToRecord(task.completions),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function transformHabit(habit: HabitWithCompletions) {
  return {
    id: habit.id,
    name: habit.name,
    completions: completionsToRecord(habit.completions),
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
  };
}
