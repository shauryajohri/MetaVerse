import { type FormEvent, type KeyboardEvent, useEffect, useState } from 'react';
import { login, session, type Role, type User } from '../api';
import { townHour } from '../town/Town';

function useClock() {
  const [hour, setHour] = useState(townHour);
  useEffect(() => {
    const id = setInterval(() => setHour(townHour()), 15_000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const time = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  const part = h < 5 ? 'Night' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 20 ? 'Evening' : 'Night';
  return { time, part };
}

const ROLES: Record<Role, { tab: string; title: [string, string]; lede: string; idLabel: string; placeholder: string; dev: string }> = {
  student: {
    tab: 'STUDENT',
    title: ['Walk in,', "don't log in."],
    lede: 'The campus is live. Sign in with your college roll number to enter.',
    idLabel: 'College Roll Number',
    placeholder: 'e.g. 2301001',
    dev: '2301001 / student123',
  },
  teacher: {
    tab: 'TEACHER',
    title: ['Your classes', 'are waiting.'],
    lede: 'Mark attendance, run PBL sessions and keep an eye on your students.',
    idLabel: 'Employee ID',
    placeholder: 'e.g. T1001',
    dev: 'T1001 / teacher123',
  },
  admin: {
    tab: 'ADMIN',
    title: ['Campus', 'control room.'],
    lede: 'Manage users, departments and the whole university from one place.',
    idLabel: 'Admin ID',
    placeholder: 'e.g. A0001',
    dev: 'A0001 / admin123',
  },
};

const ROLE_KEY = 'metaverse.role';
const savedRole = (): Role => {
  const r = localStorage.getItem(ROLE_KEY);
  return r === 'teacher' || r === 'admin' ? r : 'student';
};

export default function LoginPage({ onLogin }: { onLogin: (u: User) => void }) {
  const [role, setRole] = useState<Role>(savedRole);
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { time, part } = useClock();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const { token, user } = await login(rollNo.trim(), password, role);
      session.save(token, remember);
      localStorage.setItem(ROLE_KEY, role);
      onLogin(user);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const trackCaps = (e: KeyboardEvent) => setCaps(e.getModifierState('CapsLock'));
  const r = ROLES[role];
  const pickRole = (next: Role) => {
    setRole(next);
    setError('');
  };

  return (
    <main className="login-screen">
      <header className="brand">
        <span className="brand-mark" aria-hidden />
        <div>
          <div className="brand-name">METAVERSE</div>
          <div className="brand-sub">Graphic Era Hill University</div>
        </div>
      </header>

      <form className="panel login-panel" onSubmit={submit} noValidate>
        <div className="role-tabs" role="radiogroup" aria-label="Account type">
          {(Object.keys(ROLES) as Role[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={role === k}
              className={role === k ? 'active' : undefined}
              onClick={() => pickRole(k)}
            >
              {ROLES[k].tab}
            </button>
          ))}
        </div>
        <h1 className="title">
          {r.title[0]}
          <br />
          {r.title[1]}
        </h1>
        <p className="lede">{r.lede}</p>

        <label className="field">
          <span>{r.idLabel}</span>
          <input
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value.toUpperCase())}
            placeholder={r.placeholder}
            autoComplete="username"
            autoFocus
            spellCheck={false}
            maxLength={20}
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <div className="pw-wrap">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={trackCaps}
              onKeyDown={trackCaps}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? 'HIDE' : 'SHOW'}
            </button>
          </div>
          {caps && <small className="hint warn">Caps Lock is on</small>}
        </label>

        <div className="row">
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className="box" aria-hidden />
            Remember me
          </label>
          <span className="muted" title="Password resets are handled by your department admin for now.">
            Forgot password?
          </span>
        </div>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={busy || !rollNo || !password}>
          {busy ? <span className="blink">CONNECTING…</span> : 'ENTER CAMPUS ▶'}
        </button>

        {import.meta.env.DEV && (
          <p className="dev-hint">
            Dev account: <code>{r.dev}</code>
          </p>
        )}
      </form>

      <footer className="status">
        <span className="dot" /> Dehradun · {time} · {part}
      </footer>
    </main>
  );
}
