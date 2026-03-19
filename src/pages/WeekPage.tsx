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
                className="flex flex-col"
                style={{ minWidth: '160px', width: '160px' }}
              >
                {/* Column Header */}
                <div
                  className={`flex items-center justify-between rounded-lg px-3 py-2 mb-2 ${
                    isToday
                      ? 'bg-amber-900/30 border border-amber-600/60'
                      : 'bg-gray-800/60 border border-gray-700/40'
                  }`}
                >
                  <div>
                    <span
                      className={`text-sm font-semibold ${
                        isToday ? 'text-amber-300' : 'text-gray-300'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`ml-1.5 text-sm ${
                        isToday ? 'text-amber-400 font-bold' : 'text-gray-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModalForDate(day.iso)}
                    className={`w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${
                      isToday
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    aria-label={`Add task for ${day.dayName} ${day.dayNumber}`}
                  >
                    +
                  </button>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto pr-0.5">
                  {day.tasks.length === 0 ? (
                    <p className="text-center text-sm text-gray-600 mt-4 opacity-60">
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
