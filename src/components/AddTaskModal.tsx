import { useState, useCallback } from 'react';
import { useStore } from '../stores/useStore.ts';
import { getTodayISO, formatTime } from '../utils/index.ts';

const DURATION_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 90, 120];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;

function buildHourOptions(): number[] {
  const options: number[] = [];
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
    options.push(h);
  }
  return options;
}

function buildMinuteOptions(): number[] {
  const options: number[] = [];
  for (let m = 0; m < 60; m += 5) {
    options.push(m);
  }
  return options;
}

const HOUR_OPTIONS = buildHourOptions();
const MINUTE_OPTIONS = buildMinuteOptions();

interface AddTaskModalProps {
  isOpen: boolean;
  onClose(): void;
  initialDate?: string;
  initialSource?: 'day' | 'week' | 'month';
}

export default function AddTaskModal({ isOpen, onClose, initialDate, initialSource }: AddTaskModalProps) {
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
  const [errors, setErrors] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setTitle('');
    setHour(9);
    setMinute(0);
    setDuration(30);
    setCustomDuration('');
    setUseCustomDuration(false);
    setHardness(3);
    setRepeatable(false);
    setRepeatDays([]);
    setErrors([]);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const toggleDay = useCallback((day: string) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationErrors: string[] = [];
    if (!title.trim()) validationErrors.push('Title is required');
    if (repeatable && repeatDays.length === 0) {
      validationErrors.push('Select at least one weekday for repeatable tasks');
    }

    const finalDuration = useCustomDuration ? parseInt(customDuration, 10) : duration;
    if (useCustomDuration) {
      if (isNaN(finalDuration) || finalDuration <= 0) {
        validationErrors.push('Custom duration must be a positive number');
      } else if (finalDuration % 5 !== 0) {
        validationErrors.push('Duration must be a multiple of 5 minutes');
      }
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const startTime = hour * 60 + minute;
    await addTask({
      title: title.trim(),
      date: initialDate ?? getTodayISO(),
      startTime,
      duration: finalDuration,
      hardness,
      repeatable,
      repeatDays: repeatable ? repeatDays : [],
      source: initialSource ?? 'day',
    });

    handleClose();
  }, [title, hour, minute, duration, customDuration, useCustomDuration, hardness, repeatable, repeatDays, addTask, handleClose]);

  if (!isOpen) return null;

  const startTimeMinutes = hour * 60 + minute;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl p-6 pb-8 animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Add new task"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Task</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
            {errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="mb-4">
          <label htmlFor="task-title" className="block text-sm font-medium text-gray-300 mb-1">
            Title
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to do?"
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Start Time */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
          <div className="flex gap-2 items-center">
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
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
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
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
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500"
                aria-label="Duration in minutes"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d}m`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setUseCustomDuration(true)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Custom
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="Minutes"
                min={5}
                step={5}
                className="w-24 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                aria-label="Custom duration in minutes"
              />
              <span className="text-sm text-gray-400">min</span>
              <button
                type="button"
                onClick={() => {
                  setUseCustomDuration(false);
                  setCustomDuration('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Presets
              </button>
            </div>
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
              onClick={() => setRepeatable(!repeatable)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                repeatable ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  repeatable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {repeatable && (
            <div className="flex gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    repeatDays.includes(day)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
        >
          Add Task
        </button>
      </div>
    </div>
  );
}
