export interface Task {
  id: string;
  title: string;
  date: string;
  startTime: number;
  duration: number;
  hardness: number;
  repeatable: boolean;
  repeatDays: string[];
  source: 'day' | 'week' | 'month';
  completions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  completions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface XpEvent {
  id: string;
  date: string;
  source:
    | 'task_complete'
    | 'task_uncomplete'
    | 'habit_complete'
    | 'habit_uncomplete'
    | 'daily_all_tasks'
    | 'daily_all_tasks_lost'
    | 'daily_all_habits'
    | 'daily_all_habits_lost'
    | 'perfect_day'
    | 'perfect_day_lost';
  sourceId: string;
  amount: number;
  createdAt: string;
}

export interface UnlockTier {
  level: number;
  habitCap: number;
  taskCap: number;
  description: string;
}
