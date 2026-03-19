import type { Task } from '../types';
import { formatTime } from '../utils';
import { useStore } from '../stores/useStore';

interface WeekTaskCardProps {
  task: Task;
  dateISO: string;
}

export default function WeekTaskCard({ task, dateISO }: WeekTaskCardProps) {
  const toggleTaskDone = useStore((s) => s.toggleTaskDone);
  const deleteTask = useStore((s) => s.deleteTask);

  const isDone = task.completions[dateISO] === true;
  const stars = '\u2605'.repeat(task.hardness);

  const durationLabel =
    task.duration >= 60
      ? `${Math.floor(task.duration / 60)}h${task.duration % 60 ? ` ${task.duration % 60}m` : ''}`
      : `${task.duration} min`;

  return (
    <div
      className={`group relative rounded-lg border px-2.5 py-2 mb-1.5 text-left transition-opacity ${
        isDone
          ? 'bg-gray-800/40 border-gray-700/50 opacity-50'
          : 'bg-gray-800 border-gray-700 opacity-100'
      }`}
    >
      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          deleteTask(task.id);
        }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-950/50 text-xs items-center justify-center hidden group-hover:flex transition-colors"
        aria-label={`Delete ${task.title}`}
      >
        &times;
      </button>

      {/* Clickable area for toggling done */}
      <button
        type="button"
        onClick={() => toggleTaskDone(task.id, dateISO)}
        className="w-full text-left"
        aria-label={`${task.title}, ${formatTime(task.startTime)}, ${isDone ? 'completed' : 'not completed'}`}
      >
        {/* Time */}
        <span className="block text-[11px] text-gray-400 leading-tight">
          {formatTime(task.startTime)}
        </span>

        {/* Title */}
        <span
          className={`block text-sm font-medium text-white truncate leading-snug ${
            isDone ? 'line-through' : ''
          }`}
        >
          {task.title}
        </span>

        {/* Duration + Hardness row */}
        <span className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-gray-500">{durationLabel}</span>
          <span className="text-[10px] text-amber-400/80 leading-none">{stars}</span>
        </span>

        {/* Repeatable badge */}
        {task.repeatable && (
          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-800/50 leading-none">
            repeat
          </span>
        )}
      </button>
    </div>
  );
}
