import { create } from 'zustand';
import { setToken, clearToken } from '../services/apiService.ts';

const API_URL = 'http://localhost:3001/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  login(email: string, password: string): Promise<void>;
  signup(email: string, password: string, name: string): Promise<void>;
  logout(): void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error((body as { error?: string }).error ?? 'Login failed');
    }

    const data = (await res.json()) as { token: string; user: AuthUser };
    setToken(data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  async signup(email: string, password: string, name: string) {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Signup failed' }));
      throw new Error((body as { error?: string }).error ?? 'Signup failed');
    }

    const data = (await res.json()) as { token: string; user: AuthUser };
    setToken(data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  logout() {
    clearToken();
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
