import { type FormEvent, useMemo, useState } from 'react';
import { type Role, createUser, fetchUsers, resetPassword } from '../../api';
import { useLoad } from './useLoad';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'student', label: 'Students' },
  { id: 'teacher', label: 'Teachers' },
  { id: 'admin', label: 'Admins' },
] as const;

const ID_HINT: Record<Role, string> = { student: 'Roll number, e.g. 2301025', teacher: 'Employee ID, e.g. T2001', admin: 'Admin ID, e.g. A0002' };

function AddUser({ onDone }: { onDone: (msg: string) => void }) {
  const [role, setRole] = useState<Role>('student');
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user } = await createUser({ role, rollNo, name, password });
      onDone(`Added ${user.name} (${user.rollNo}). Share the password with them privately.`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form className="card add-user" onSubmit={submit}>
      <h3>Add a user</h3>
      <div className="form-grid">
        <label className="field">
          <span>Account type</span>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="field">
          <span>ID</span>
          <input value={rollNo} onChange={(e) => setRollNo(e.target.value.toUpperCase())} placeholder={ID_HINT[role]} required maxLength={20} spellCheck={false} />
        </label>
        <label className="field">
          <span>Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ritu Sharma" required maxLength={60} />
        </label>
        <label className="field">
          <span>Starting password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" />
        </label>
      </div>
      {role === 'student' && <p className="muted-text">New students join CSE 5th sem, section A, with no PBL group yet.</p>}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <button className="btn-primary slim" disabled={busy || !rollNo || !name || password.length < 8}>
        {busy ? 'ADDING…' : 'ADD USER'}
      </button>
    </form>
  );
}

function ResetPassword({ id, name, onDone }: { id: number; name: string; onDone: (msg: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(id, pw);
      onDone(`Password reset for ${name}.`);
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <form className="reset-row" onSubmit={submit}>
      <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (8+ characters)" autoFocus autoComplete="new-password" aria-label={`New password for ${name}`} />
      <button className="btn-small" disabled={pw.length < 8}>
        Save
      </button>
      {error && <small className="c-absent">{error}</small>}
    </form>
  );
}

export default function Users() {
  const { data, error, reload } = useLoad(fetchUsers);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.users ?? [])
      .filter((u) => filter === 'all' || u.role === filter)
      .filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.rollNo.toLowerCase().includes(needle));
  }, [data, filter, q]);

  const done = (msg: string) => {
    setNote(msg);
    setAdding(false);
    setResetting(null);
    reload();
  };

  return (
    <>
      <header className="view-head head-row">
        <div>
          <h2>Users</h2>
          <p>Students, teachers and admins who can log in.</p>
        </div>
        <button className="btn-primary slim" onClick={() => setAdding((a) => !a)}>
          {adding ? 'CANCEL' : '+ ADD USER'}
        </button>
      </header>

      {adding && <AddUser onDone={done} />}
      {note && (
        <p className="banner ok" role="status">
          {note}
        </p>
      )}

      <section className="card flush">
        <div className="toolbar">
          <div className="seg" role="radiogroup" aria-label="Filter by role">
            {FILTERS.map((f) => (
              <button key={f.id} role="radio" aria-checked={filter === f.id} className={filter === f.id ? 'on' : undefined} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <input className="search" placeholder="Search name or ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
          <span className="count">{data ? `${rows.length} users` : ''}</span>
        </div>

        {error ? (
          <p className="loading-inline">{error}</p>
        ) : !data ? (
          <p className="loading-inline blink">Loading…</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Type</th>
                <th>Details</th>
                <th className="num">Password</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td className="mono">{u.rollNo}</td>
                  <td>
                    <span className={`chip role-${u.role}`}>{u.role}</span>
                  </td>
                  <td className="muted-inline">{u.detail}</td>
                  <td className="num">
                    {resetting === u.id ? (
                      <ResetPassword id={u.id} name={u.name} onDone={done} />
                    ) : (
                      <button className="btn-small" onClick={() => setResetting(u.id)}>
                        Reset
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
