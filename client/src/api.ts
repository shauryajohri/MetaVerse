// Web: same-origin (Vite proxies /api). Desktop build loads from file://, so it needs an absolute URL.
const BASE = import.meta.env.VITE_API_URL ?? (location.protocol === 'file:' ? 'http://localhost:4000' : '');

export type Role = 'student' | 'teacher' | 'admin';
export interface User {
  id: number;
  rollNo: string;
  name: string;
  role: Role;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, init);
  } catch {
    throw new Error("Can't reach the campus server. Is it running?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !data.error && res.status >= 502) throw new Error("Can't reach the campus server. Is it running?");
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const login = (rollNo: string, password: string) =>
  request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rollNo, password }),
  });

export const fetchMe = (token: string) =>
  request<{ user: User }>('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });

// "Remember me" keeps the token across restarts; otherwise it dies with the tab/window.
const KEY = 'metaverse.token';
export const session = {
  load: () => localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY),
  save: (token: string, remember: boolean) => (remember ? localStorage : sessionStorage).setItem(KEY, token),
  clear: () => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  },
};
