import { create } from 'zustand';
import type { Task, Habit, XpEvent } from '../types';
import { dataService } from '../services/dataService';
import { calculateTaskXP, calculateHabitXP, getCapsForLevel, getLevelFromXP, getTotalXP } from '../utils/xp';
import { getTasksForDate, getHabitStreak } from '../utils/index';

interface AppStore {
  tasks: Task[];
  habits: Habit[];
  xpEvents: XpEvent[];
  isLoading: boolean;
  loadError: string | null;

  loadData(): Promise<void>;
  addTask(task: Omit<Task, 'id' | 'completions' | 'createdAt' | 'updatedAt'>): Promise<void>;
  updateTask(id: string, updates: Partial<Task>): Promise<void>;
  deleteTask(id: string): Promise<void>;
  toggleTaskDone(taskId: string, date: string): Promise<void>;
  addHabit(name: string): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  toggleHabitCompletion(habitId: string, date: string): Promise<void>;
}

export const useStore = create<AppStore>((set, get) => {
  // Private helper to create and save an XP event
  async function saveXpEvent(
    date: string,
    source: XpEvent['source'],
    sourceId: string,
    amount: number,
  ): Promise<XpEvent> {
    const event: XpEvent = {
      id: crypto.randomUUID(),
      date,
      source,
      sourceId,
      amount,
      createdAt: new Date().toISOString(),
    };
    await dataService.saveXpEvent(event);
    set({ xpEvents: [...get().xpEvents, event] });
    return event;
  }

  // Private helper to check if a bonus type is "active" for a date
  function isBonusActive(
    xpEvents: XpEvent[],
    date: string,
    bonusSource: string,
    lostSource: string,
  ): boolean {
    const netSum = xpEvents
      .filter(
        (e) =>
          e.date === date &&
          (e.source === bonusSource || e.source === lostSource),
      )
      .reduce((sum, e) => sum + e.amount, 0);
    return netSum > 0;
  }

  // Private helper to recalculate daily bonuses for a date
  async function recalculateDailyBonuses(date: string): Promise<void> {
    try {
      const tasks = get().tasks;
      const habits = get().habits;
      const dateObj = new Date(date + 'T00:00:00');

      // 1. ALL TASKS BONUS
      const tasksForDate = getTasksForDate(tasks, dateObj);
      const allTasksDone =
        tasksForDate.length > 0 &&
        tasksForDate.every((t) => t.completions[date] === true);
      const taskBonusActive = isBonusActive(
        get().xpEvents,
        date,
        'daily_all_tasks',
        'daily_all_tasks_lost',
      );

      if (allTasksDone && !taskBonusActive) {
        await saveXpEvent(date, 'daily_all_tasks', '', 40);
      } else if (!allTasksDone && taskBonusActive) {
        await saveXpEvent(date, 'daily_all_tasks_lost', '', -40);
      }

      // 2. ALL HABITS BONUS
      const allHabitsDone =
        habits.length > 0 &&
        habits.every((h) => h.completions[date] === true);
      const habitBonusActive = isBonusActive(
        get().xpEvents,
        date,
        'daily_all_habits',
        'daily_all_habits_lost',
      );

      if (allHabitsDone && !habitBonusActive) {
        await saveXpEvent(date, 'daily_all_habits', '', 30);
      } else if (!allHabitsDone && habitBonusActive) {
        await saveXpEvent(date, 'daily_all_habits_lost', '', -30);
      }

      // 3. PERFECT DAY BONUS
      const taskBonusNowActive = isBonusActive(
        get().xpEvents,
        date,
        'daily_all_tasks',
        'daily_all_tasks_lost',
      );
      const habitBonusNowActive = isBonusActive(
        get().xpEvents,
        date,
        'daily_all_habits',
        'daily_all_habits_lost',
      );
      const perfectDayActive = isBonusActive(
        get().xpEvents,
        date,
        'perfect_day',
        'perfect_day_lost',
      );

      if (taskBonusNowActive && habitBonusNowActive && !perfectDayActive) {
        await saveXpEvent(date, 'perfect_day', '', 25);
      } else if (
        !(taskBonusNowActive && habitBonusNowActive) &&
        perfectDayActive
      ) {
        await saveXpEvent(date, 'perfect_day_lost', '', -25);
      }
    } catch {
      // XP bonus recalculation is fire-and-forget
    }
  }

  return {
    tasks: [],
    habits: [],
    xpEvents: [],
    isLoading: true,
    loadError: null,

    async loadData() {
      set({ tasks: [], habits: [], xpEvents: [], isLoading: true, loadError: null });
      try {
        const [tasks, habits, xpEvents] = await Promise.all([
          dataService.getTasks(),
          dataService.getHabits(),
          dataService.getXpEvents(),
        ]);
        set({ tasks, habits, xpEvents, isLoading: false });
      } catch (err) {
        set({ isLoading: false, loadError: err instanceof Error ? err.message : 'Failed to load data' });
      }
    },

    async addTask(taskData) {
      // Enforce task cap
      const level = getLevelFromXP(getTotalXP(get().xpEvents));
      const { taskCap } = getCapsForLevel(level);
      const dateObj = new Date(taskData.date + 'T00:00:00');
      const tasksForDate = getTasksForDate(get().tasks, dateObj);
      if (tasksForDate.length >= taskCap) {
        throw new Error('Task cap reached for this day. Level up to unlock more slots!');
      }

      const now = new Date().toISOString();
      const task: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        completions: {},
        createdAt: now,
        updatedAt: now,
      };
      const saved = await dataService.saveTask(task);
      set({ tasks: [...get().tasks, saved] });
    },

    async updateTask(id, updates) {
      const updated = await dataService.updateTask(id, updates);
      set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
    },

    async deleteTask(id) {
      await dataService.deleteTask(id);
      set({ tasks: get().tasks.filter((t) => t.id !== id) });

      // Clean up XP events for this task
      try {
        const affectedDates = new Set(
          get().xpEvents.filter((e) => e.sourceId === id).map((e) => e.date),
        );
        await dataService.deleteXpEventsBySourceId(id);
        set({ xpEvents: get().xpEvents.filter((e) => e.sourceId !== id) });
        for (const date of affectedDates) {
          await recalculateDailyBonuses(date);
        }
      } catch {
        // XP cleanup is fire-and-forget
      }
    },

    async toggleTaskDone(taskId, date) {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const wasDone = !!task.completions[date];
      const completions = { ...task.completions };
      if (completions[date]) {
        delete completions[date];
      } else {
        completions[date] = true;
      }
      // Optimistic update so rapid toggles read the latest intent
      const optimistic = { ...task, completions };
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? optimistic : t)) });
      try {
        const updated = await dataService.updateTask(taskId, { completions });
        set({ tasks: get().tasks.map((t) => (t.id === taskId ? updated : t)) });

        // XP events after successful API call
        try {
          const xpAmount = calculateTaskXP(task.hardness, task.duration);
          if (!wasDone) {
            // Toggled ON
            await saveXpEvent(date, 'task_complete', taskId, xpAmount);
          } else {
            // Toggled OFF
            await saveXpEvent(date, 'task_uncomplete', taskId, -xpAmount);
          }
          await recalculateDailyBonuses(date);
        } catch {
          // XP event saving is fire-and-forget
        }
      } catch {
        // Revert on failure
        set({ tasks: get().tasks.map((t) => (t.id === taskId ? task : t)) });
      }
    },

    async addHabit(name) {
      // Enforce habit cap
      const level = getLevelFromXP(getTotalXP(get().xpEvents));
      const { habitCap } = getCapsForLevel(level);
      if (get().habits.length >= habitCap) {
        throw new Error('Habit cap reached. Level up to unlock more slots!');
      }

      const now = new Date().toISOString();
      const habit: Habit = {
        id: crypto.randomUUID(),
        name,
        completions: {},
        createdAt: now,
        updatedAt: now,
      };
      const saved = await dataService.saveHabit(habit);
      set({ habits: [...get().habits, saved] });
    },

    async deleteHabit(id) {
      await dataService.deleteHabit(id);
      set({ habits: get().habits.filter((h) => h.id !== id) });

      // Clean up XP events for this habit
      try {
        const affectedDates = new Set(
          get().xpEvents.filter((e) => e.sourceId === id).map((e) => e.date),
        );
        await dataService.deleteXpEventsBySourceId(id);
        set({ xpEvents: get().xpEvents.filter((e) => e.sourceId !== id) });
        for (const date of affectedDates) {
          await recalculateDailyBonuses(date);
        }
      } catch {
        // XP cleanup is fire-and-forget
      }
    },

    async toggleHabitCompletion(habitId, date) {
      const habit = get().habits.find((h) => h.id === habitId);
      if (!habit) return;
      const wasDone = !!habit.completions[date];

      // Compute streak BEFORE toggle for uncomplete case
      const previousStreak = wasDone ? getHabitStreak(habit) : 0;

      const completions = { ...habit.completions };
      if (completions[date]) {
        delete completions[date];
      } else {
        completions[date] = true;
      }
      // Optimistic update so rapid toggles read the latest intent
      const optimistic = { ...habit, completions };
      set({ habits: get().habits.map((h) => (h.id === habitId ? optimistic : h)) });
      try {
        const updated = await dataService.updateHabit(habitId, { completions });
        set({ habits: get().habits.map((h) => (h.id === habitId ? updated : h)) });

        // XP events after successful API call
        try {
          if (!wasDone) {
            // Toggled ON - compute streak AFTER toggle
            const streak = getHabitStreak(optimistic);
            await saveXpEvent(date, 'habit_complete', habitId, calculateHabitXP(streak));
          } else {
            // Toggled OFF - use streak from BEFORE toggle
            await saveXpEvent(date, 'habit_uncomplete', habitId, -calculateHabitXP(previousStreak));
          }
          await recalculateDailyBonuses(date);
        } catch {
          // XP event saving is fire-and-forget
        }
      } catch {
        // Revert on failure
        set({ habits: get().habits.map((h) => (h.id === habitId ? habit : h)) });
      }
    },
  };
});
