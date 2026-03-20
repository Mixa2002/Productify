import { useState, useMemo } from 'react';
import { useStore } from '../stores/useStore';
import {
  getCurrentWeekDates,
  getWeekDayName,
  getTasksForDate,
  formatDateISO,
  getTodayISO,
} from '../utils';
import TaskFormModal from '../components/TaskFormModal';
import WeekTaskCard from '../components/WeekTaskCard';

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function formatWeekRange(dates: Date[]): string {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const startMonth = MONTH_NAMES_SHORT[first.getMonth()];
  const endMonth = MONTH_NAMES_SHORT[last.getMonth()];
  const startDay = first.getDate();
  const endDay = last.getDate();
  const year = last.getFullYear();

  return `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}, ${year}`;
}

export default function WeekPage() {
  const { tasks, isLoading } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(getTodayISO());

  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const todayISO = getTodayISO();

  const tasksByDay = useMemo(() => {
    return weekDates.map((date) => ({
      date,
      iso: formatDateISO(date),
      dayName: getWeekDayName(date),
      dayNumber: date.getDate(),
      tasks: getTasksForDate(tasks, date).sort((a, b) => a.startTime - b.startTime),
    }));
  }, [tasks, weekDates]);

  const openModalForDate = (iso: string) => {
    setModalDate(iso);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col page-content">
      {/* Week title */}
      <div className="px-6 pt-4 pb-3 shrink-0">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {formatWeekRange(weekDates)}
        </h1>
      </div>

      {/* Scrollable week grid */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4">
        <div
          className="flex h-full"
          style={{ minWidth: `${7 * 150}px` }}
        >
          {tasksByDay.map((day, colIndex) => {
            const isToday = day.iso === todayISO;
            const isLastColumn = colIndex === 6;

            return (
              <div
                key={day.iso}
                className="flex flex-col min-w-0 h-full"
                style={{
                  flex: '1 1 0%',
                  minWidth: '150px',
                  borderRight: isLastColumn ? 'none' : '1px solid var(--accent-pale)',
                  backgroundColor: isToday ? 'rgba(162, 203, 139, 0.12)' : 'transparent',
                }}
              >
                {/* Sticky column header */}
                <div
                  className="sticky top-0 z-10 px-2 pt-2 pb-2 shrink-0"
                  style={{
                    backgroundColor: isToday ? 'rgba(162, 203, 139, 0.12)' : 'var(--bg-app)',
                  }}
                >
                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={
                      isToday
                        ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                        : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }
                    }
                  >
                    <div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isToday ? '#ffffff' : 'var(--text-primary)' }}
                      >
                        {day.dayName}
                      </span>
                      <span
                        className={`ml-1.5 text-sm ${isToday ? 'font-bold' : ''}`}
                        style={{ color: isToday ? 'var(--accent-tint)' : 'var(--text-secondary)' }}
                      >
                        {day.dayNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openModalForDate(day.iso)}
                      className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: isToday ? 'rgba(255,255,255,0.25)' : 'var(--accent)',
                        color: '#ffffff',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = isToday ? 'rgba(255,255,255,0.35)' : 'var(--accent-light)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = isToday ? 'rgba(255,255,255,0.25)' : 'var(--accent)')
                      }
                      aria-label={`Add task for ${day.dayName} ${day.dayNumber}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Scrollable task list */}
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                  {day.tasks.length === 0 ? (
                    <p
                      className="text-xs text-center pt-6 select-none"
                      style={{ color: 'var(--text-secondary)', opacity: 0.6 }}
                    >
                      No tasks
                    </p>
                  ) : (
                    day.tasks.map((task) => (
                      <WeekTaskCard
                        key={`${task.id}-${day.iso}`}
                        task={task}
                        dateISO={day.iso}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      <TaskFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        defaultDate={modalDate}
        source="week"
      />
    </div>
  );
}
