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

export const login = (rollNo: string, password: string, role: Role) =>
  request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rollNo, password, role }),
  });

export const fetchMe = (token: string) =>
  request<{ user: User }>('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });

// ---- student ----

export interface Profile extends User {
  course: string;
  branch: string;
  department: string;
  semester: number;
  section: string;
  batch: string;
  email: string;
  pblGroup: string | null;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
  source: 'metaverse' | 'erp';
}

export interface Summary {
  held: number;
  attended: number;
  percent: number;
  canMiss: number;
  mustAttend: number;
}

export interface SubjectAttendance extends Summary {
  code: string;
  name: string;
  faculty: string;
  records: AttendanceRecord[];
}

export interface Attendance {
  threshold: number;
  overall: Summary;
  subjects: SubjectAttendance[];
}

export type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming';

export interface Pbl {
  id: string;
  mentor: { name: string; department: string };
  members: { name: string; rollNo: string; role: string; you: boolean }[];
  project: { title: string; domain: string; summary: string };
  milestones: { title: string; due: string; status: MilestoneStatus; remarks: string | null }[];
  attendance: Summary & { threshold: number; sessions: (AttendanceRecord & { topic: string })[] };
}

const authed = <T,>(path: string, init: RequestInit = {}) =>
  request<T>(path, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${session.load() ?? ''}` },
  });

export const fetchProfile = () => authed<Profile>('/api/student/profile');
export const fetchAttendance = () => authed<Attendance>('/api/student/attendance');
export const fetchPbl = () => authed<Pbl>('/api/student/pbl');

// ---- teacher ----

export type Status = 'present' | 'absent';

export interface TeacherClass {
  key: string;
  kind: 'subject' | 'pbl';
  title: string;
  subtitle: string;
  students: number;
  pending: number;
}

export interface SessionInfo {
  date: string;
  state: 'marked' | 'pending' | 'demo';
  markedAt: string | null;
}

export interface RosterEntry {
  userId: number;
  rollNo: string;
  name: string;
  status: Status | null;
  percent: number;
}

const cls = (key: string) => `/api/teacher/classes/${encodeURIComponent(key)}/sessions`;

export const fetchTeacherClasses = () => authed<{ threshold: number; classes: TeacherClass[] }>('/api/teacher/classes');
export const fetchSessions = (key: string) => authed<{ sessions: SessionInfo[] }>(cls(key));
export const fetchRoster = (key: string, date: string) => authed<{ date: string; roster: RosterEntry[] }>(`${cls(key)}/${date}`);
export const saveRoster = (key: string, date: string, statuses: Record<number, Status>) =>
  authed<{ date: string; roster: RosterEntry[]; sessions: SessionInfo[] }>(`${cls(key)}/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ statuses }),
  });

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
