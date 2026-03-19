import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './stores/useStore';
import DayPage from './pages/DayPage';
import HabitsPage from './pages/HabitsPage';
import WeekPage from './pages/WeekPage';
import MonthPage from './pages/MonthPage';

const tabs = [
  { path: '/day', label: 'Day' },
  { path: '/habits', label: 'Habits' },
  { path: '/week', label: 'Week' },
  { path: '/month', label: 'Month' },
] as const;

function AppRoutes() {
  const location = useLocation();

  return (
    <main className="max-w-2xl mx-auto">
      <div key={location.pathname} className="animate-page-fade">
        <Routes location={location}>
          <Route path="/day" element={<DayPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/week" element={<WeekPage />} />
          <Route path="/month" element={<MonthPage />} />
          <Route path="*" element={<Navigate to="/day" replace />} />
        </Routes>
      </div>
    </main>
  );
}

export default function App() {
  const loadData = useStore((s) => s.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <nav className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-2xl mx-auto flex">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `flex-1 text-center py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-b-2'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { color: 'var(--accent)', borderBottomColor: 'var(--accent)' }
                    : undefined
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
