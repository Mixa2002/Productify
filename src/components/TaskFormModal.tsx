import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '../stores/useStore.ts';
import { formatTime, getTasksForDate } from '../utils/index.ts';
import { getTotalXP, getLevelFromXP, getCapsForLevel, getUnlockTiers } from '../utils/xp.ts';

const DURATION_PRESETS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 90, 120, 150, 180];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;

const HOUR_OPTIONS: number[] = [];
for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
  HOUR_OPTIONS.push(h);
}

const MINUTE_OPTIONS: number[] = [];
for (let m = 0; m < 60; m += 5) {
  MINUTE_OPTIONS.push(m);
}

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string;
  source: 'day' | 'week' | 'month';
}

export default function TaskFormModal({ isOpen, onClose, defaultDate, source }: TaskFormModalProps) {
  const addTask = useStore((s) => s.addTask);
  const tasks = useStore((s) => s.tasks);
  const xpEvents = useStore((s) => s.xpEvents);

  const capInfo = useMemo(() => {
    const level = getLevelFromXP(getTotalXP(xpEvents));
    const caps = getCapsForLevel(level);
    const dateObj = new Date(defaultDate + 'T00:00:00');
    const taskCount = getTasksForDate(tasks, dateObj).length;
    const atCap = taskCount >= caps.taskCap;

    // Find next tier where taskCap is higher than current
    const tiers = getUnlockTiers();
    const currentTaskCap = caps.taskCap;
    const nextTaskTier = tiers.find((t) => t.level > level && t.taskCap > currentTaskCap);
    const atFinalCap = currentTaskCap >= 14;

    return { taskCount, taskCap: caps.taskCap, atCap, nextTaskTier, atFinalCap };
  }, [xpEvents, tasks, defaultDate]);

  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(30);
  const [hardness, setHardness] = useState(3);
  const [repeatable, setRepeatable] = useState(false);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [repeatDaysError, setRepeatDaysError] = useState('');

  // Reset all form fields when the modal opens (not on close, to avoid flicker)
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setHour(9);
      setMinute(0);
      setDuration(30);
      setHardness(3);
      setRepeatable(false);
      setRepeatDays([]);
      setIsSubmitting(false);
      setTitleError('');
      setRepeatDaysError('');
    }
  }, [isOpen]);

  const toggleDay = useCallback((day: string) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setRepeatDaysError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    let hasError = false;

    // Title validation
    if (!title.trim()) {
      setTitleError('Title is required');
      hasError = true;
    } else {
      setTitleError('');
    }

    // Repeat days validation
    if (repeatable && repeatDays.length === 0) {
      setRepeatDaysError('Select at least one weekday');
      hasError = true;
    } else {
      setRepeatDaysError('');
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      const startTime = hour * 60 + minute;
      await addTask({
        title: title.trim(),
        date: defaultDate,
        startTime,
        duration,
        hardness,
        repeatable,
        repeatDays: repeatable ? repeatDays : [],
        source,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, title, hour, minute, duration, hardness, repeatable, repeatDays, addTask, onClose, defaultDate, source]);

  if (!isOpen) return null;

  const startTimeMinutes = hour * 60 + minute;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-overlay-fade"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-t-2xl p-6 pb-8 animate-slide-up overflow-y-auto"
        style={{ maxHeight: '90vh', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Add new task"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            New Task
            {!capInfo.atCap && capInfo.taskCap - capInfo.taskCount <= 2 && (
              <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>
                ({capInfo.taskCount}/{capInfo.taskCap})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {capInfo.atCap && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}
          >
            {capInfo.atFinalCap
              ? `Maximum daily task slots reached (${capInfo.taskCount}/${capInfo.taskCap})`
              : `Daily task limit reached (${capInfo.taskCount}/${capInfo.taskCap}). Reach Level ${capInfo.nextTaskTier!.level} to unlock ${capInfo.nextTaskTier!.description}.`}
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label htmlFor="task-title" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Title
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError('');
            }}
            placeholder="What do you need to do?"
            disabled={capInfo.atCap}
            className="w-full px-3 py-2 rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#ffffff',
              borderColor: titleError ? '#dc2626' : 'var(--border-light)',
              color: 'var(--text-primary)',
              boxShadow: 'none',
            }}
            onFocus={(e) => { if (!titleError) e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { if (!titleError) e.currentTarget.style.borderColor = 'var(--border-light)'; }}
          />
          {titleError && (
            <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>{titleError}</p>
          )}
        </div>

        {/* Start Time */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Start Time</label>
          <div className="flex gap-2 items-center">
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              disabled={capInfo.atCap}
              className="px-3 py-2 rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffffff', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
              aria-label="Hour"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {formatTime(h * 60).split(':')[0]}
                </option>
              ))}
            </select>
            <span style={{ color: 'var(--text-secondary)' }}>:</span>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              disabled={capInfo.atCap}
              className="px-3 py-2 rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#ffffff', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
              aria-label="Minute"
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>
              {formatTime(startTimeMinutes)}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={capInfo.atCap}
            className="px-3 py-2 rounded-lg border focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#ffffff', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            aria-label="Duration in minutes"
          >
            {DURATION_PRESETS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </div>

        {/* Hardness */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Hardness
          </label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setHardness(level)}
                disabled={capInfo.atCap}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={
                  level === hardness
                    ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                    : { backgroundColor: 'var(--accent-tint)', color: 'var(--text-secondary)' }
                }
                aria-label={`Hardness level ${level} of 5`}
                aria-pressed={level === hardness}
              >
                Lv.{level}
              </button>
            ))}
          </div>
        </div>

        {/* Repeatable */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <label htmlFor="repeatable-toggle" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Repeatable
            </label>
            <button
              id="repeatable-toggle"
              type="button"
              role="switch"
              aria-checked={repeatable}
              disabled={capInfo.atCap}
              onClick={() => {
                setRepeatable(!repeatable);
                setRepeatDaysError('');
              }}
              className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: repeatable ? 'var(--accent)' : 'var(--border-light)' }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  repeatable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {repeatable && (
            <>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                    style={
                      repeatDays.includes(day)
                        ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                        : { backgroundColor: 'var(--accent-tint)', color: 'var(--text-secondary)' }
                    }
                  >
                    {day}
                  </button>
                ))}
              </div>
              {repeatDaysError && (
                <p className="mt-1 text-sm" style={{ color: '#dc2626' }}>{repeatDaysError}</p>
              )}
            </>
          )}
        </div>

        {/* Submit */}
        {!capInfo.atCap && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--accent-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent)'; }}
          >
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </button>
        )}
      </div>
    </div>
  );
}
