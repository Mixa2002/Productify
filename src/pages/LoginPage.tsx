import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/day', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 shadow-md"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
      >
        <h1 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>
          Sign in to GRIND
        </h1>

        {error && (
          <div
            className="mb-4 text-sm text-center rounded-lg px-3 py-2"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
              style={{
                borderColor: 'var(--border-light)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                // @ts-expect-error CSS custom property for focus ring
                '--tw-ring-color': 'var(--accent)',
              }}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
              style={{
                borderColor: 'var(--border-light)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                // @ts-expect-error CSS custom property for focus ring
                '--tw-ring-color': 'var(--accent)',
              }}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors hover-brighten disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium underline" style={{ color: 'var(--accent)' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
