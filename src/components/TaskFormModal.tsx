import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../stores/useStore.ts';
import { formatTime } from '../utils/index.ts';

const DURATION_PRESETS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 90, 120];
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

  const [title, setTitle] = useState('');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [hardness, setHardness] = useState(3);
  const [repeatable, setRepeatable] = useState(false);
  const [repeatDays, setRepeatDays] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [durationError, setDurationError] = useState('');
  const [repeatDaysError, setRepeatDaysError] = useState('');

  // Reset all form fields when the modal opens (not on close, to avoid flicker)
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setHour(9);
      setMinute(0);
      setDuration(30);
      setCustomDuration('');
      setUseCustomDuration(false);
      setHardness(3);
      setRepeatable(false);
      setRepeatDays([]);
      setIsSubmitting(false);
      setTitleError('');
      setDurationError('');
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

    // Duration validation
    const finalDuration = useCustomDuration ? parseInt(customDuration, 10) : duration;
    if (useCustomDuration) {
      if (isNaN(finalDuration) || finalDuration < 5) {
        setDurationError('Duration must be at least 5 minutes');
        hasError = true;
      } else if (finalDuration % 5 !== 0) {
        setDurationError('Duration must be a multiple of 5 minutes');
        hasError = true;
      } else {
        setDurationError('');
      }
    } else {
      setDurationError('');
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
        duration: finalDuration,
        hardness,
        repeatable,
        repeatDays: repeatable ? repeatDays : [],
        source,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, title, hour, minute, duration, customDuration, useCustomDuration, hardness, repeatable, repeatDays, addTask, onClose, defaultDate, source]);

  if (!isOpen) return null;

  const startTimeMinutes = hour * 60 + minute;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 animate-overlay-fade"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl p-6 pb-8 animate-slide-up overflow-y-auto"
        style={{ maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
        aria-label="Add new task"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label htmlFor="task-title" className="block text-sm font-medium text-gray-300 mb-1">
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
            className={`w-full px-3 py-2 rounded-lg bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent)] ${
              titleError ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {titleError && (
            <p className="mt-1 text-sm text-red-400">{titleError}</p>
          )}
        </div>

        {/* Start Time */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
          <div className="flex gap-2 items-center">
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-[var(--accent)]"
              aria-label="Hour"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {formatTime(h * 60).split(':')[0]}
                </option>
              ))}
            </select>
            <span className="text-gray-400">:</span>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-[var(--accent)]"
              aria-label="Minute"
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400 ml-2">
              {formatTime(startTimeMinutes)}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
          {!useCustomDuration ? (
            <div className="flex gap-2 items-center">
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-[var(--accent)]"
                aria-label="Duration in minutes"
              >
                {DURATION_PRESETS.map((d) => (
                  <option key={d} value={d}>
                    {d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d}m`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setUseCustomDuration(true)}
                className="text-xs hover:opacity-80" style={{ color: 'var(--accent-light)' }}
              >
                Custom
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  setDurationError('');
                }}
                placeholder="Minutes"
                min={5}
                step={5}
                className={`w-24 px-3 py-2 rounded-lg bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent)] ${
                  durationError ? 'border-red-500' : 'border-gray-700'
                }`}
                aria-label="Custom duration in minutes"
              />
              <span className="text-sm text-gray-400">min</span>
              <button
                type="button"
                onClick={() => {
                  setUseCustomDuration(false);
                  setCustomDuration('');
                  setDurationError('');
                }}
                className="text-xs hover:opacity-80" style={{ color: 'var(--accent-light)' }}
              >
                Presets
              </button>
            </div>
          )}
          {durationError && (
            <p className="mt-1 text-sm text-red-400">{durationError}</p>
          )}
        </div>

        {/* Hardness */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Hardness
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setHardness(level)}
                className={`text-2xl transition-colors ${
                  level <= hardness ? 'text-amber-400' : 'text-gray-600'
                }`}
                aria-label={`Hardness ${level} of 5`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Repeatable */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <label htmlFor="repeatable-toggle" className="text-sm font-medium text-gray-300">
              Repeatable
            </label>
            <button
              id="repeatable-toggle"
              type="button"
              role="switch"
              aria-checked={repeatable}
              onClick={() => {
                setRepeatable(!repeatable);
                setRepeatDaysError('');
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                repeatable ? '' : 'bg-gray-700'
              }`}
              style={repeatable ? { backgroundColor: 'var(--accent)' } : undefined}
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
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      repeatDays.includes(day)
                        ? 'text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                    style={repeatDays.includes(day) ? { backgroundColor: 'var(--accent)' } : undefined}
                  >
                    {day}
                  </button>
                ))}
              </div>
              {repeatDaysError && (
                <p className="mt-1 text-sm text-red-400">{repeatDaysError}</p>
              )}
            </>
          )}
        </div>

        {/* Submit */}
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
      </div>
    </div>
  );
}
