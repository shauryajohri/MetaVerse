import { useEffect, useMemo, useState } from 'react';
import {
  type RosterEntry,
  type SessionInfo,
  type Status,
  type TeacherClass,
  fetchRoster,
  fetchSessions,
  saveRoster,
} from '../../api';
import { fmtDate, tone } from '../student/ui';

const STATE_LABEL = { pending: 'To mark', marked: 'Marked', demo: 'Earlier record' };

export default function MarkAttendance({
  classes,
  threshold,
  onSaved,
}: {
  classes: TeacherClass[];
  threshold: number;
  onSaved: () => void;
}) {
  const [key, setKey] = useState(() => classes.find((c) => c.pending)?.key ?? classes[0]?.key);
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [draft, setDraft] = useState<Record<number, Status>>({});
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const cls = classes.find((c) => c.key === key);

  // class → its sessions; default to the oldest session still waiting to be marked
  useEffect(() => {
    if (!key) return;
    setSessions(null);
    setRoster(null);
    fetchSessions(key)
      .then(({ sessions }) => {
        setSessions(sessions);
        const pending = sessions.filter((s) => s.state === 'pending');
        setDate((pending.at(-1) ?? sessions[0])?.date ?? null);
      })
      .catch((e: Error) => setNote({ kind: 'err', text: e.message }));
  }, [key]);

  // session → roster; the draft starts from whatever is already recorded
  useEffect(() => {
    if (!key || !date) return;
    setRoster(null);
    setNote(null);
    fetchRoster(key, date)
      .then(({ roster }) => {
        setRoster(roster);
        setDraft(Object.fromEntries(roster.filter((r) => r.status).map((r) => [r.userId, r.status!])));
      })
      .catch((e: Error) => setNote({ kind: 'err', text: e.message }));
  }, [key, date]);

  const counts = useMemo(() => {
    const vals = Object.values(draft);
    const present = vals.filter((v) => v === 'present').length;
    const absent = vals.length - present;
    return { present, absent, unmarked: (roster?.length ?? 0) - vals.length };
  }, [draft, roster]);

  const dirty = !!roster && roster.some((r) => draft[r.userId] !== (r.status ?? undefined));

  const confirmLeave = () => !dirty || confirm('You have unsaved attendance. Discard it?');
  const pickClass = (k: string) => k !== key && confirmLeave() && setKey(k);
  const pickDate = (d: string) => d !== date && confirmLeave() && setDate(d);

  const set = (id: number, s: Status) => setDraft((d) => ({ ...d, [id]: s }));
  const setAll = (s: Status) => roster && setDraft(Object.fromEntries(roster.map((r) => [r.userId, s])));

  const save = async () => {
    if (!key || !date || counts.unmarked) return;
    setSaving(true);
    try {
      const res = await saveRoster(key, date, draft);
      setRoster(res.roster);
      setSessions(res.sessions);
      setNote({ kind: 'ok', text: `Saved — ${counts.present} present, ${counts.absent} absent.` });
      onSaved();
    } catch (e) {
      setNote({ kind: 'err', text: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const pendingTotal = classes.reduce((n, c) => n + c.pending, 0);

  return (
    <>
      <header className="view-head">
        <h2>Mark attendance</h2>
        <p>{pendingTotal ? `${pendingTotal} session${pendingTotal > 1 ? 's' : ''} waiting to be marked` : 'All caught up — every session is marked.'}</p>
      </header>

      <div className="class-picker" role="radiogroup" aria-label="Class">
        {classes.map((c) => (
          <button
            key={c.key}
            role="radio"
            aria-checked={c.key === key}
            title={`${c.title} · ${c.subtitle}`}
            className={`card class-card${c.key === key ? ' active' : ''}`}
            onClick={() => pickClass(c.key)}
          >
            <span className="eyebrow">{c.kind === 'pbl' ? 'PBL group' : 'Class'}</span>
            <strong>{c.kind === 'pbl' ? c.subtitle.replace('PBL group ', 'Group ') : c.title}</strong>
            <small>{c.kind === 'pbl' ? c.title : c.subtitle}</small>
            <span className="class-meta">
              {c.students} students
              {c.pending > 0 && <span className="chip in-progress">{c.pending} to mark</span>}
            </span>
          </button>
        ))}
      </div>

      {cls && (
        <section className="card flush marking">
          <div className="session-strip" role="radiogroup" aria-label="Session date">
            {sessions?.map((s) => (
              <button key={s.date} role="radio" aria-checked={s.date === date} className={`session ${s.state}${s.date === date ? ' active' : ''}`} onClick={() => pickDate(s.date)}>
                <strong>{fmtDate(s.date, { weekday: 'short' })}</strong>
                <span>{fmtDate(s.date)}</span>
                <small>{STATE_LABEL[s.state]}</small>
              </button>
            ))}
          </div>

          {!roster || !date ? (
            <p className="loading-inline blink">Loading roster…</p>
          ) : (
            <>
              <div className="roster-bar">
                <div>
                  <strong>
                    {cls.kind === 'pbl' ? cls.subtitle : cls.title} · {fmtDate(date, { weekday: 'long', day: 'numeric', month: 'short' })}
                  </strong>
                  <small>
                    <span className="c-present">{counts.present} present</span> · <span className="c-absent">{counts.absent} absent</span>
                    {counts.unmarked > 0 && <> · {counts.unmarked} not marked</>}
                  </small>
                </div>
                <div className="bulk">
                  <button className="btn-small" onClick={() => setAll('present')}>
                    All present
                  </button>
                  <button className="btn-small" onClick={() => setDraft({})}>
                    Clear
                  </button>
                </div>
              </div>

              <div className="roster" role="table" aria-label="Students">
                {roster.map((r, i) => {
                  const s = draft[r.userId];
                  return (
                    <div
                      key={r.userId}
                      role="row"
                      className={`roster-row${s ? ` ${s}` : ''}`}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'p' || e.key === 'P') set(r.userId, 'present');
                        if (e.key === 'a' || e.key === 'A') set(r.userId, 'absent');
                      }}
                    >
                      <span className="r-num">{i + 1}</span>
                      <span className="r-name">
                        <strong>{r.name}</strong>
                        <small>{r.rollNo}</small>
                      </span>
                      <span className={`r-pct pct ${tone(r.percent, threshold)}`} title="Attendance so far in this class">
                        {r.percent}%
                      </span>
                      <span className="toggle" role="radiogroup" aria-label={`${r.name} attendance`}>
                        <button role="radio" aria-checked={s === 'present'} className={s === 'present' ? 'on present' : undefined} onClick={() => set(r.userId, 'present')}>
                          P
                        </button>
                        <button role="radio" aria-checked={s === 'absent'} className={s === 'absent' ? 'on absent' : undefined} onClick={() => set(r.userId, 'absent')}>
                          A
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="save-bar">
                <span className={note ? `note ${note.kind}` : 'note'} role="status">
                  {note?.text ?? (counts.unmarked ? `Mark all ${roster.length} students to save.` : dirty ? 'Unsaved changes.' : 'No changes.')}
                </span>
                <span className="hint-keys">Tip: focus a row and press P or A</span>
                <button className="btn-primary slim" onClick={save} disabled={saving || !dirty || counts.unmarked > 0}>
                  {saving ? 'SAVING…' : 'SAVE ATTENDANCE'}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
