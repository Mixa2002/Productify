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

const MONTH_DETAIL_START = 360; // 6 AM
const MONTH_DETAIL_END = 1320;  // 10 PM
const MONTH_DETAIL_HOURS: number[] = [];
for (let m = MONTH_DETAIL_START; m <= MONTH_DETAIL_END; m += 60) {
  MONTH_DETAIL_HOURS.push(m);
}

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
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col page-content">
      {/* Header */}
      <div className="px-6 pt-4 pb-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{monthLabel}</h1>
      </div>

      {/* Calendar Grid */}
      <div className="px-4">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium py-1"
              style={{ color: 'var(--text-secondary)' }}
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
                    ${!entry.isCurrentMonth ? 'opacity-30' : ''}
                    ${isToday && !isSelected ? 'font-semibold' : ''}
                    ${isSelected ? 'text-white font-semibold' : ''}
                  `}
                  style={{
                    color: !isSelected && entry.isCurrentMonth ? 'var(--text-primary)' : undefined,
                    ...(isToday && !isSelected ? { boxShadow: '0 0 0 2px var(--accent)', color: 'var(--accent)' } : {}),
                    ...(isSelected ? { backgroundColor: 'var(--accent)' } : {}),
                    ...(isToday && isSelected ? { boxShadow: '0 0 0 2px var(--accent-light)', backgroundColor: 'var(--accent)' } : {}),
                  }}
                >
                  {entry.date.getDate()}
                </span>
                {/* Task indicator dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{
                    backgroundColor: hasTasks && entry.isCurrentMonth
                      ? 'var(--accent)'
                      : hasTasks && !entry.isCurrentMonth
                        ? 'rgba(132, 177, 121, 0.3)'
                        : 'transparent',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail Panel */}
      <div className="flex-1 flex flex-col min-h-0 mt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-3">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatSelectedDate(selectedDate)}
          </h2>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--accent)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-light)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent)')}
            aria-label="Add task for selected day"
          >
            +
          </button>
        </div>

        {/* Mini time grid for selected day */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="relative">
            {/* Hour slot rows */}
            {MONTH_DETAIL_HOURS.map((minute) => (
              <div key={minute} className="flex items-start" style={{ height: '28px' }}>
                <span className="text-[10px] w-12 shrink-0 select-none leading-none pt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {formatTime(minute)}
                </span>
                <div className="flex-1" style={{ borderTop: '1px solid rgba(199, 234, 187, 0.5)' }} />
              </div>
            ))}

            {/* Task cards positioned over the time grid */}
            <div className="absolute top-0 left-12 right-0">
              {selectedDayTasks.map((task) => {
                const slotOffset = Math.max(0, task.startTime - MONTH_DETAIL_START);
                const topPx = (slotOffset / 60) * 28;
                return (
                  <div key={`${task.id}-${selectedISO}`} className="absolute left-0 right-0" style={{ top: `${topPx}px` }}>
                    <WeekTaskCard task={task} dateISO={selectedISO} />
                  </div>
                );
              })}
            </div>

            {/* No tasks message */}
            {selectedDayTasks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>No tasks</p>
              </div>
            )}
          </div>
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
