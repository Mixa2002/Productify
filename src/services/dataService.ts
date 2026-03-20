import type { Task, Habit } from '../types/index.ts';
import { apiService } from './apiService.ts';

export interface DataService {
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  getHabits(): Promise<Habit[]>;
  saveHabit(habit: Habit): Promise<Habit>;
  updateHabit(id: string, updates: Partial<Habit>): Promise<Habit>;
  deleteHabit(id: string): Promise<void>;
}

export const dataService: DataService = apiService;
