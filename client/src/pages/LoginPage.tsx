import { type FormEvent, type KeyboardEvent, useEffect, useState } from 'react';
import { login, session, type User } from '../api';
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

export default function LoginPage({ onLogin }: { onLogin: (u: User) => void }) {
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
      const { token, user } = await login(rollNo.trim(), password);
      session.save(token, remember);
      onLogin(user);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const trackCaps = (e: KeyboardEvent) => setCaps(e.getModifierState('CapsLock'));

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
        <div className="panel-tab">STUDENT LOGIN</div>
        <h1 className="title">
          Walk in,
          <br />
          don&apos;t log in.
        </h1>
        <p className="lede">The campus is live. Sign in with your college roll number to enter.</p>

        <label className="field">
          <span>College Roll Number</span>
          <input
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value.toUpperCase())}
            placeholder="e.g. 2301001"
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
            Dev accounts: <code>2301001</code> / <code>student123</code> · <code>T1001</code> / <code>teacher123</code>
          </p>
        )}
      </form>

      <footer className="status">
        <span className="dot" /> Dehradun · {time} · {part}
      </footer>
    </main>
  );
}
