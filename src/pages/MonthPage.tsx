import { useState, useMemo } from 'react';
import { useStore } from '../stores/useStore';
import {
  getCurrentMonthDates,
  getTasksForDate,
  formatDateISO,
  formatTime,
  getTodayISO,
} from '../utils';
import TaskFormModal from '../components/TaskFormModal';
import WeekTaskCard from '../components/WeekTaskCard';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const LONG_DAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function formatSelectedDate(date: Date): string {
  const dayName = LONG_DAY_NAMES[date.getDay()];
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  return `${dayName}, ${month} ${day}`;
}

export default function MonthPage() {
  const { tasks, isLoading } = useStore();
  const todayISO = getTodayISO();
  const [selectedISO, setSelectedISO] = useState(todayISO);
  const [modalOpen, setModalOpen] = useState(false);

  const monthGrid = useMemo(() => getCurrentMonthDates(), []);

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  // Build a set of date ISOs that have tasks for quick dot rendering
  const datesWithTasks = useMemo(() => {
    const set = new Set<string>();
    for (const entry of monthGrid) {
      const iso = formatDateISO(entry.date);
      const dayTasks = getTasksForDate(tasks, entry.date);
      if (dayTasks.length > 0) {
        set.add(iso);
      }
    }
    return set;
  }, [tasks, monthGrid]);

  // Find the selected date object from the grid
  const selectedDate = useMemo(() => {
    const entry = monthGrid.find((e) => formatDateISO(e.date) === selectedISO);
    return entry?.date ?? new Date();
  }, [selectedISO, monthGrid]);

  // Tasks for the selected day, sorted by start time
  const selectedDayTasks = useMemo(() => {
    return getTasksForDate(tasks, selectedDate).sort(
      (a, b) => a.startTime - b.startTime
    );
  }, [tasks, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      {/* Header */}
      <div className="px-6 pt-4 pb-3">
        <h1 className="text-xl font-bold text-white">{monthLabel}</h1>
      </div>

      {/* Calendar Grid */}
      <div className="px-4">
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

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {monthGrid.map((entry) => {
            const iso = formatDateISO(entry.date);
            const isToday = iso === todayISO;
            const isSelected = iso === selectedISO;
            const hasTasks = datesWithTasks.has(iso);

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedISO(iso)}
                className="flex flex-col items-center justify-center py-1.5 transition-colors"
                aria-label={`${entry.date.getDate()} ${isToday ? '(today)' : ''}`}
              >
                <span
                  className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors
                    ${!entry.isCurrentMonth ? 'text-gray-600 opacity-40' : ''}
                    ${entry.isCurrentMonth && !isToday && !isSelected ? 'text-gray-200' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-amber-500 text-amber-400 font-semibold' : ''}
                    ${isSelected ? 'bg-amber-600 text-white font-semibold' : ''}
                    ${isToday && isSelected ? 'bg-amber-600 ring-2 ring-amber-400 text-white font-semibold' : ''}
                  `}
                >
                  {entry.date.getDate()}
                </span>
                {/* Task indicator dot */}
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                    hasTasks && entry.isCurrentMonth
                      ? 'bg-blue-400'
                      : hasTasks && !entry.isCurrentMonth
                        ? 'bg-blue-400/30'
                        : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Panel */}
      <div className="flex-1 flex flex-col min-h-0 mt-3 border-t border-gray-800">
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-3">
          <h2 className="text-base font-semibold text-gray-200">
            {formatSelectedDate(selectedDate)}
          </h2>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-7 h-7 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold flex items-center justify-center transition-colors"
            aria-label="Add task for selected day"
          >
            +
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {selectedDayTasks.length === 0 ? (
            <p className="text-center text-sm text-gray-600 mt-6 opacity-60">
              No tasks for this day
            </p>
          ) : (
            selectedDayTasks.map((task) => (
              <WeekTaskCard
                key={`${task.id}-${selectedISO}`}
                task={task}
                dateISO={selectedISO}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <TaskFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDate={selectedISO}
        source="month"
      />
    </div>
  );
}
