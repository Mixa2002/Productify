import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './stores/useStore.ts';
import { useAuthStore } from './stores/authStore.ts';
import DayPage from './pages/DayPage.tsx';
import HabitsPage from './pages/HabitsPage.tsx';
import WeekPage from './pages/WeekPage.tsx';
import MonthPage from './pages/MonthPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import SignupPage from './pages/SignupPage.tsx';

const tabs = [
  { path: '/day', label: 'Day' },
  { path: '/habits', label: 'Habits' },
  { path: '/week', label: 'Week' },
  { path: '/month', label: 'Month' },
] as const;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <main className="max-w-2xl mx-auto">
      <div key={location.pathname} className="animate-page-fade">
        <Routes location={location}>
          <Route path="/day" element={<ProtectedRoute><DayPage /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
          <Route path="/week" element={<ProtectedRoute><WeekPage /></ProtectedRoute>} />
          <Route path="/month" element={<ProtectedRoute><MonthPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/day" replace />} />
        </Routes>
      </div>
    </main>
  );
}

export default function App() {
  const loadData = useStore((s) => s.loadData);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
        {isAuthenticated && (
          <nav className="sticky top-0 z-10 shadow-sm" style={{ backgroundColor: 'var(--bg-nav)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            <div className="max-w-2xl mx-auto flex items-center">
              <div className="flex flex-1">
                {tabs.map((tab) => (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    className={({ isActive }) =>
                      `flex-1 text-center py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-b-2 font-bold'
                          : 'opacity-80 hover:opacity-100'
                      }`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? { color: '#ffffff', borderBottomColor: 'var(--accent-tint)' }
                        : { color: 'var(--accent-tint)' }
                    }
                  >
                    {tab.label}
                  </NavLink>
                ))}
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 mr-2 text-xs font-medium rounded-md transition-colors"
                style={{ color: 'var(--accent-tint)', backgroundColor: 'rgba(255,255,255,0.15)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                aria-label={`Sign out ${user?.name ?? ''}`}
                title={user?.name ?? 'Sign out'}
              >
                Sign out
              </button>
            </div>
          </nav>
        )}

        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
