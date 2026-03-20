import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.ts';

export default function SignupPage() {
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup(email, password, name);
      navigate('/day', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
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
          Create your account
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
            <label htmlFor="signup-name" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
              style={{
                borderColor: 'var(--border-light)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                // @ts-expect-error CSS custom property for focus ring
                '--tw-ring-color': 'var(--accent)',
              }}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
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
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors hover-brighten disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium underline" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
