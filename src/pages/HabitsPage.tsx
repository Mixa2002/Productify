import { useState, useMemo, useCallback, memo } from 'react';
import type { Habit } from '../types';
import { useStore } from '../stores/useStore';
import {
  getHabitStreak,
  getHabitDayPercentage,
  getTodayISO,
  formatDateISO,
  getCurrentMonthDates,
} from '../utils';
import AddHabitModal from '../components/AddHabitModal';
import HabitProgressRing from '../components/HabitProgressRing';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

interface HabitRowProps {
  habit: Habit;
  todayISO: string;
  onToggle: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

const HabitRow = memo<HabitRowProps>(function HabitRow({ habit, todayISO, onToggle, onDelete }) {
  const isDone = habit.completions[todayISO] === true;
  const streak = getHabitStreak(habit);
  const [bouncing, setBouncing] = useState(false);

  const handleToggle = useCallback(() => {
    if (!isDone) {
      setBouncing(true);
      setTimeout(() => setBouncing(false), 300);
    }
    onToggle(habit.id);
  }, [isDone, onToggle, habit.id]);

  return (
    <li
      className={`group flex items-center gap-3 p-3 rounded-lg border transition-colors hover-lift ${
        isDone
          ? 'border-y-gray-700 border-r-gray-700'
          : 'border-gray-700 bg-gray-900'
      }`}
      style={isDone ? { borderLeftWidth: '3px', borderLeftColor: 'var(--accent)', backgroundColor: 'rgba(132, 177, 121, 0.08)' } : undefined}
    >
      {/* Toggle checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isDone}
        aria-label={`Mark ${habit.name} as ${isDone ? 'incomplete' : 'complete'}`}
        onClick={handleToggle}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${bouncing ? 'animate-habit-bounce' : ''} ${
          isDone
            ? 'text-white'
            : 'border-gray-500 hover:border-gray-300'
        }`}
        style={isDone ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
      >
        {isDone && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 7l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Name */}
      <span className={`flex-1 text-sm font-medium ${isDone ? 'text-gray-300' : 'text-gray-100'}`}>
        {habit.name}
      </span>

      {/* Streak */}
      <span className="text-xs whitespace-nowrap streak-transition" style={{ color: 'var(--accent-light)' }}>
        {streak > 0 && (
          <>
            <span className="mr-0.5" role="img" aria-label="streak">
              {'\uD83D\uDD25'}
            </span>
            {streak} {streak === 1 ? 'day' : 'days'}
          </>
        )}
      </span>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(habit.id, habit.name)}
        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        aria-label={`Delete ${habit.name}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M5 2h6M2 4h12M6 4v8M10 4v8M3.5 4l.5 9a1 1 0 001 1h6a1 1 0 001-1l.5-9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </li>
  );
});

HabitRow.displayName = 'HabitRow';

export default function HabitsPage() {
  const { habits, isLoading, toggleHabitCompletion, deleteHabit } = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  const todayISO = getTodayISO();
  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const monthGrid = useMemo(() => getCurrentMonthDates(), []);

  // Memoize the earliest habit creation date
  const earliestHabitDate = useMemo(() => {
    if (habits.length === 0) return null;
    return habits.reduce((earliest, h) => {
      const d = h.createdAt.split('T')[0];
      return d < earliest ? d : earliest;
    }, habits[0].createdAt.split('T')[0]);
  }, [habits]);

  // Memoize habit percentage calculations for the calendar
  const habitPercentages = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of monthGrid) {
      const iso = formatDateISO(entry.date);
      if (iso > todayISO || !entry.isCurrentMonth) continue;
      // Show nothing for days before any habits were created
      if (earliestHabitDate && iso < earliestHabitDate) {
        map.set(iso, -1); // -1 means "no habits existed yet"
      } else {
        map.set(iso, getHabitDayPercentage(habits, iso));
      }
    }
    return map;
  }, [habits, monthGrid, todayISO, earliestHabitDate]);

  const handleToggle = useCallback(
    (habitId: string) => {
      toggleHabitCompletion(habitId, todayISO);
    },
    [toggleHabitCompletion, todayISO],
  );

  const handleDelete = useCallback(
    (habitId: string, habitName: string) => {
      if (window.confirm(`Delete "${habitName}"? This cannot be undone.`)) {
        deleteHabit(habitId);
      }
    },
    [deleteHabit],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      {/* --- Today's Habits --- */}
      <div className="px-6 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">Today's Habits</h1>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            aria-label="Add new habit"
          >
            +
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-gray-600 mb-2" aria-hidden="true">
              <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 18l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-gray-500">
              No habits yet. Tap + to start building your streaks.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                todayISO={todayISO}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>

      {/* --- Monthly Completion Calendar --- */}
      {habits.length > 0 && (
        <div className="mt-3 border-t border-gray-800 px-4 pt-3 pb-4 overflow-y-auto">
          <h2 className="text-base font-semibold text-gray-200 mb-2 px-2">
            {monthLabel}
          </h2>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {monthGrid.map((entry) => {
              const iso = formatDateISO(entry.date);
              const isToday = iso === todayISO;
              const isFuture = iso > todayISO;

              if (!entry.isCurrentMonth) {
                return <div key={iso} className="flex flex-col items-center py-1" />;
              }

              const cachedPct = habitPercentages.get(iso);
              const beforeHabitsExisted = cachedPct === -1;
              const pct = isFuture || beforeHabitsExisted ? 0 : (cachedPct ?? 0);

              return (
                <div
                  key={iso}
                  className="flex flex-col items-center py-1"
                >
                  <span
                    className={`text-[10px] mb-0.5 ${
                      isToday
                        ? 'font-semibold'
                        : 'text-gray-500'
                    }`}
                    style={isToday ? { color: 'var(--accent-light)' } : undefined}
                  >
                    {entry.date.getDate()}
                  </span>
                  <HabitProgressRing percentage={pct} isFuture={isFuture || beforeHabitsExisted} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      <AddHabitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
