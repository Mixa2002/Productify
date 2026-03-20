import { useState, useMemo, useCallback } from 'react';
import { useStore } from '../stores/useStore.ts';
import { getTasksForDate, getTodayISO, formatTime } from '../utils/index.ts';
import TimeGrid from '../components/TimeGrid.tsx';
import TaskFormModal from '../components/TaskFormModal.tsx';

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function formatHeaderDate(date: Date): string {
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  const dayNumber = date.getDate();
  return `${dayName}, ${monthName} ${dayNumber}`;
}

export default function DayPage() {
  const { tasks, isLoading } = useStore();
  const toggleTaskDone = useStore((s) => s.toggleTaskDone);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => getTodayISO(), []);
  const todayTasks = useMemo(() => getTasksForDate(tasks, today), [tasks, today]);

  const todoTasks = useMemo(
    () => todayTasks.filter((t) => !t.completions[todayISO]).sort((a, b) => a.startTime - b.startTime),
    [todayTasks, todayISO],
  );
  const doneTasks = useMemo(
    () => todayTasks.filter((t) => t.completions[todayISO] === true).sort((a, b) => a.startTime - b.startTime),
    [todayTasks, todayISO],
  );

  const handleToggle = useCallback(
    (taskId: string) => {
      toggleTaskDone(taskId, todayISO);
    },
    [toggleTaskDone, todayISO],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col page-content">
      {/* Header */}
      <div className="px-6 pt-4 pb-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatHeaderDate(today)}</h1>
      </div>

      {/* 3-column layout: To Do | Time Grid | Done */}
      <div className="flex-1 flex min-h-0">
        {/* Left Column: To Do — hidden on small screens, shown on md+ */}
        <div
          className="hidden md:flex flex-col w-64 flex-shrink-0 border-r overflow-y-auto"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              To Do
              <span
                className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'var(--accent-tint)', color: 'var(--accent)' }}
              >
                {todoTasks.length}
              </span>
            </h2>
          </div>
          <div className="px-3 pb-4 space-y-2">
            {todoTasks.length === 0 && (
              <p className="text-sm px-1 py-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                All done for today!
              </p>
            )}
            {todoTasks.map((task) => (
              <TodoCard key={task.id} task={task} onToggle={handleToggle} />
            ))}
          </div>
        </div>

        {/* Center: Time Grid */}
        <div className="flex-1 min-w-0">
          <TimeGrid tasks={todayTasks} />
        </div>

        {/* Right Column: Done — hidden on small screens, shown on md+ */}
        <div
          className="hidden md:flex flex-col w-56 flex-shrink-0 border-l overflow-y-auto"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Done
              <span
                className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(132, 177, 121, 0.15)', color: 'var(--accent)' }}
              >
                {doneTasks.length}
              </span>
            </h2>
          </div>
          <div className="px-3 pb-4 space-y-1">
            {doneTasks.length === 0 && (
              <p className="text-sm px-1 py-4 text-center" style={{ color: 'var(--text-secondary)' }}>
                No tasks completed yet
              </p>
            )}
            {doneTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => handleToggle(task.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm line-through transition-colors"
                style={{ color: 'var(--text-secondary)', opacity: 0.6 }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(199, 234, 187, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                aria-label={`Undo completion: ${task.title}`}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: To Do and Done sections below the grid */}
      <div className="md:hidden flex border-t" style={{ borderColor: 'var(--border-light)', maxHeight: '40vh', overflow: 'hidden' }}>
        {/* Mobile To Do */}
        <div className="flex-1 overflow-y-auto border-r" style={{ borderColor: 'var(--border-light)' }}>
          <div className="px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              To Do ({todoTasks.length})
            </h2>
          </div>
          <div className="px-2 pb-3 space-y-1.5">
            {todoTasks.map((task) => (
              <TodoCard key={task.id} task={task} onToggle={handleToggle} />
            ))}
          </div>
        </div>
        {/* Mobile Done */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Done ({doneTasks.length})
            </h2>
          </div>
          <div className="px-2 pb-3 space-y-1">
            {doneTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => handleToggle(task.id)}
                className="w-full text-left px-2 py-1.5 rounded text-xs line-through"
                style={{ color: 'var(--text-secondary)', opacity: 0.6 }}
                aria-label={`Undo completion: ${task.title}`}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed right-6 z-20 w-14 h-14 rounded-full text-white text-3xl shadow-lg flex items-center justify-center transition-colors hover-brighten"
        style={{ backgroundColor: 'var(--accent)', bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-light)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
        aria-label="Add task"
      >
        +
      </button>

      {/* Add Task Modal */}
      <TaskFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultDate={getTodayISO()} source="day" />
    </div>
  );
}

/* ---- To Do Card Component ---- */

import type { Task } from '../types/index.ts';

interface TodoCardProps {
  task: Task;
  onToggle: (taskId: string) => void;
}

function TodoCard({ task, onToggle }: TodoCardProps) {
  const durationLabel = `${task.duration} min`;
  const hardnessBorderClass = `hardness-border-${task.hardness}`;

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${hardnessBorderClass}`}
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)' }}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className="mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors"
          style={{ borderColor: 'var(--accent)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(132, 177, 121, 0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          aria-label={`Mark "${task.title}" as done`}
        />
        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="block text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {task.title}
          </span>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {formatTime(task.startTime)}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {durationLabel}
            </span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              Lv.{task.hardness}
            </span>
            {task.repeatable && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded leading-none"
                style={{ backgroundColor: 'rgba(132, 177, 121, 0.15)', color: 'var(--accent)', border: '1px solid rgba(132, 177, 121, 0.25)' }}
              >
                repeat
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
