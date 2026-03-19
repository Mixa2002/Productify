import { useState, useMemo } from 'react';
import { useStore } from '../stores/useStore';
import {
  getCurrentWeekDates,
  getWeekDayName,
  getTasksForDate,
  formatDateISO,
  formatTime,
  getTodayISO,
} from '../utils';
import TaskFormModal from '../components/TaskFormModal';
import WeekTaskCard from '../components/WeekTaskCard';

const WEEK_GRID_START = 360; // 6 AM in minutes
const WEEK_GRID_END = 1320;  // 10 PM in minutes
const WEEK_HOURS: number[] = [];
for (let m = WEEK_GRID_START; m <= WEEK_GRID_END; m += 60) {
  WEEK_HOURS.push(m);
}

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

  if (first.getMonth() === last.getMonth()) {
    return `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}, ${year}`;
  }
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
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      {/* Header */}
      <div className="px-6 pt-4 pb-3">
        <h1 className="text-xl font-bold text-white">
          {formatWeekRange(weekDates)}
        </h1>
      </div>

      {/* Day Columns */}
      <div className="flex-1 overflow-x-auto overscroll-contain px-4 pb-4">
        <div className="flex gap-2 min-w-max h-full">
          {tasksByDay.map((day) => {
            const isToday = day.iso === todayISO;

            return (
              <div
                key={day.iso}
                className={`flex flex-col ${isToday ? 'rounded-lg' : ''}`}
                style={isToday ? { backgroundColor: 'rgba(132, 177, 121, 0.08)' } : undefined}
                style={{ minWidth: '160px', width: '160px' }}
              >
                {/* Column Header */}
                <div
                  className={`flex items-center justify-between rounded-lg px-3 py-2 mb-2 ${
                    isToday
                      ? 'border'
                      : 'bg-gray-800/60 border border-gray-700/40'
                  }`}
                  style={isToday ? { backgroundColor: 'rgba(132, 177, 121, 0.15)', borderColor: 'rgba(132, 177, 121, 0.4)' } : undefined}
                >
                  <div>
                    <span
                      className={`text-sm font-semibold ${
                        isToday ? '' : 'text-gray-300'
                      }`}
                      style={isToday ? { color: 'var(--accent-pale)' } : undefined}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`ml-1.5 text-sm ${
                        isToday ? 'font-bold' : 'text-gray-400'
                      }`}
                      style={isToday ? { color: 'var(--accent-light)' } : undefined}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModalForDate(day.iso)}
                    className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center transition-colors text-white"
                    style={
                      isToday
                        ? { backgroundColor: 'var(--accent)' }
                        : { backgroundColor: '#374151' }
                    }
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = isToday ? 'var(--accent-light)' : '#4B5563')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isToday ? 'var(--accent)' : '#374151')
                    }
                    aria-label={`Add task for ${day.dayName} ${day.dayNumber}`}
                  >
                    +
                  </button>
                </div>

                {/* Tasks with hour markers */}
                <div className="flex-1 overflow-y-auto pr-0.5 relative">
                  {/* Hour marker lines */}
                  {WEEK_HOURS.map((minute) => {
                    const hourLabel = formatTime(minute);
                    const showLabel = minute % 120 === 0; // label every 2 hours
                    return (
                      <div key={minute} className="flex items-center" style={{ height: '28px' }}>
                        {showLabel && (
                          <span className="text-[9px] text-gray-600 w-full text-center select-none leading-none">
                            {hourLabel}
                          </span>
                        )}
                        <div className="absolute left-0 right-0 border-t border-gray-800/40" style={{ pointerEvents: 'none' }} />
                      </div>
                    );
                  })}

                  {/* Task cards overlaid */}
                  <div className="absolute inset-0 pt-0.5 overflow-y-auto">
                    {day.tasks.map((task) => (
                      <WeekTaskCard
                        key={`${task.id}-${day.iso}`}
                        task={task}
                        dateISO={day.iso}
                      />
                    ))}
                  </div>
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
