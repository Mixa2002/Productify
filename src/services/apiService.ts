import type { Task, Habit, XpEvent } from '../types/index.ts';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

// --- Token management (module-level, not localStorage) ---

let _token: string | null = null;

export function setToken(token: string): void {
  _token = token;
}

export function clearToken(): void {
  _token = null;
}

// --- Helpers ---

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }
  return res.json() as Promise<T>;
}

// --- Completions cache for diffing ---

const taskCompletionsCache = new Map<string, Record<string, boolean>>();
const habitCompletionsCache = new Map<string, Record<string, boolean>>();

// --- API Service ---

export const apiService = {
  // ---------- Tasks ----------

  async getTasks(): Promise<Task[]> {
    const res = await fetch(`${API_URL}/tasks`, { headers: authHeaders() });
    const tasks = await handleResponse<Task[]>(res);
    // Populate cache
    for (const t of tasks) {
      taskCompletionsCache.set(t.id, { ...t.completions });
    }
    return tasks;
  },

  async saveTask(task: Task): Promise<Task> {
    const { title, date, startTime, duration, hardness, repeatable, repeatDays, source } = task;
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, date, startTime, duration, hardness, repeatable, repeatDays, source }),
    });
    const saved = await handleResponse<Task>(res);
    taskCompletionsCache.set(saved.id, { ...saved.completions });
    return saved;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    // Completion toggle path
    if (updates.completions !== undefined) {
      const oldCompletions = taskCompletionsCache.get(id) ?? {};
      const newCompletions = updates.completions;

      // Find dates toggled ON (present in new, absent in old)
      for (const date of Object.keys(newCompletions)) {
        if (!oldCompletions[date]) {
          const r = await fetch(`${API_URL}/tasks/${id}/completions`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ date, done: true }),
          });
          await handleResponse<Task>(r);
        }
      }

      // Find dates toggled OFF (present in old, absent in new)
      for (const date of Object.keys(oldCompletions)) {
        if (!(date in newCompletions)) {
          const r = await fetch(`${API_URL}/tasks/${id}/completions`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ date, done: false }),
          });
          await handleResponse<Task>(r);
        }
      }

      // Re-fetch to get canonical state
      const fetchRes = await fetch(`${API_URL}/tasks`, { headers: authHeaders() });
      const allTasks = await handleResponse<Task[]>(fetchRes);
      for (const t of allTasks) {
        taskCompletionsCache.set(t.id, { ...t.completions });
      }
      const updated = allTasks.find((t) => t.id === id);
      if (!updated) throw new Error(`Task ${id} not found after completion update`);
      return updated;
    }

    // Normal field update path
    const { completions: _c, id: _id, createdAt: _ca, updatedAt: _ua, ...allowedUpdates } = updates as Task;
    void _c; void _id; void _ca; void _ua;
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(allowedUpdates),
    });
    const task = await handleResponse<Task>(res);
    taskCompletionsCache.set(task.id, { ...task.completions });
    return task;
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleResponse<void>(res);
    taskCompletionsCache.delete(id);
  },

  // ---------- Habits ----------

  async getHabits(): Promise<Habit[]> {
    const res = await fetch(`${API_URL}/habits`, { headers: authHeaders() });
    const habits = await handleResponse<Habit[]>(res);
    for (const h of habits) {
      habitCompletionsCache.set(h.id, { ...h.completions });
    }
    return habits;
  },

  async saveHabit(habit: Habit): Promise<Habit> {
    const res = await fetch(`${API_URL}/habits`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: habit.name }),
    });
    const saved = await handleResponse<Habit>(res);
    habitCompletionsCache.set(saved.id, { ...saved.completions });
    return saved;
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    // Completion toggle path
    if (updates.completions !== undefined) {
      const oldCompletions = habitCompletionsCache.get(id) ?? {};
      const newCompletions = updates.completions;

      // Find dates toggled ON
      for (const date of Object.keys(newCompletions)) {
        if (!oldCompletions[date]) {
          const r = await fetch(`${API_URL}/habits/${id}/completions`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ date, done: true }),
          });
          await handleResponse<Habit>(r);
        }
      }

      // Find dates toggled OFF
      for (const date of Object.keys(oldCompletions)) {
        if (!(date in newCompletions)) {
          const r = await fetch(`${API_URL}/habits/${id}/completions`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ date, done: false }),
          });
          await handleResponse<Habit>(r);
        }
      }

      // Re-fetch to get canonical state
      const fetchRes = await fetch(`${API_URL}/habits`, { headers: authHeaders() });
      const allHabits = await handleResponse<Habit[]>(fetchRes);
      for (const h of allHabits) {
        habitCompletionsCache.set(h.id, { ...h.completions });
      }
      const updated = allHabits.find((h) => h.id === id);
      if (!updated) throw new Error(`Habit ${id} not found after completion update`);
      return updated;
    }

    // Habits have no PATCH endpoint on the backend, so this is a no-op for non-completion updates.
    // Return the current cached version.
    const fetchRes = await fetch(`${API_URL}/habits`, { headers: authHeaders() });
    const allHabits = await handleResponse<Habit[]>(fetchRes);
    const habit = allHabits.find((h) => h.id === id);
    if (!habit) throw new Error(`Habit ${id} not found`);
    return habit;
  },

  async deleteHabit(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/habits/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleResponse<void>(res);
    habitCompletionsCache.delete(id);
  },

  // ---------- XP Events ----------

  async getXpEvents(): Promise<XpEvent[]> {
    const res = await fetch(`${API_URL}/xp/events`, { headers: authHeaders() });
    return handleResponse<XpEvent[]>(res);
  },

  async saveXpEvent(event: XpEvent): Promise<XpEvent> {
    const res = await fetch(`${API_URL}/xp/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        date: event.date,
        source: event.source,
        sourceId: event.sourceId,
        amount: event.amount,
      }),
    });
    return handleResponse<XpEvent>(res);
  },

  async deleteXpEventsBySourceId(sourceId: string): Promise<void> {
    const res = await fetch(`${API_URL}/xp/events?sourceId=${encodeURIComponent(sourceId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleResponse<void>(res);
  },
};
