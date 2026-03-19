import { useState, useMemo } from 'react';
import { useStore } from '../stores/useStore.ts';
import { getTasksForDate, getTodayISO } from '../utils/index.ts';
import TimeGrid from '../components/TimeGrid.tsx';
import TaskFormModal from '../components/TaskFormModal.tsx';

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

function formatHeaderDate(date: Date): string {
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  const dayNumber = date.getDate();
  return `${dayName}, ${monthName} ${dayNumber}`;
}

export default function DayPage() {
  const { tasks, isLoading } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayTasks = useMemo(() => getTasksForDate(tasks, today), [tasks, today]);

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
        <h1 className="text-xl font-bold text-white">{formatHeaderDate(today)}</h1>
      </div>

      {/* Time Grid or Empty State */}
      {todayTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-gray-500 text-lg mb-1">Your day is clear.</p>
          <p className="text-gray-600 text-sm">Tap + to plan it.</p>
        </div>
      ) : (
        <TimeGrid tasks={todayTasks} />
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-20 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-3xl shadow-lg flex items-center justify-center transition-colors"
        aria-label="Add task"
      >
        +
      </button>

      {/* Add Task Modal */}
      <TaskFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} defaultDate={getTodayISO()} source="day" />
    </div>
  );
}
