import { type FormEvent, useState } from 'react';
import { type User, changePassword } from '../api';

export default function Settings({ user }: { user: User }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    setBusy(true);
    setNote(null);
    try {
      await changePassword(current, next);
      setNote({ kind: 'ok', text: 'Password changed. Use the new one next time you log in.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setNote({ kind: 'err', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="view-head">
        <h2>Settings</h2>
        <p>
          Signed in as {user.name} ({user.rollNo})
        </p>
      </header>

      <form className="card narrow" onSubmit={submit}>
        <h3>Change my password</h3>
        <label className="field">
          <span>Current password</span>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
        </label>
        <label className="field">
          <span>New password</span>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
          {mismatch && <small className="hint warn">Passwords don't match</small>}
        </label>
        {note && (
          <div className={note.kind === 'ok' ? 'banner ok' : 'error'} role="status">
            {note.text}
          </div>
        )}
        <button className="btn-primary slim" disabled={busy || !current || next.length < 8 || next !== confirm}>
          {busy ? 'SAVING…' : 'CHANGE PASSWORD'}
        </button>
      </form>
    </>
  );
}
