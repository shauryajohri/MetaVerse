import type { Attendance, Pbl, Profile } from '../../api';
import { Bar, Percent, advice, daysUntil, fmtDate } from './ui';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Overview({ profile, attendance, pbl }: { profile: Profile; attendance: Attendance; pbl: Pbl | null }) {
  const t = attendance.threshold;
  const low = attendance.subjects.filter((s) => s.percent < t);
  const next = pbl?.milestones.find((m) => m.status !== 'completed');
  const recent = attendance.subjects
    .flatMap((s) => s.records.map((r) => ({ ...r, subject: s.name })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <>
      <header className="view-head">
        <h2>
          {greeting()}, {profile.name.split(' ')[0]}
        </h2>
        <p>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · Semester {profile.semester} ·{' '}
          {profile.branch}-{profile.section}
        </p>
      </header>

      <div className="stats">
        <div className="card stat">
          <span className="stat-label">Class attendance</span>
          <Percent value={attendance.overall.percent} threshold={t} />
          <Bar percent={attendance.overall.percent} threshold={t} />
          <span className="stat-sub">
            {attendance.overall.attended} of {attendance.overall.held} classes
          </span>
        </div>

        <div className="card stat">
          <span className="stat-label">PBL attendance</span>
          {pbl ? (
            <>
              <Percent value={pbl.attendance.percent} threshold={t} />
              <Bar percent={pbl.attendance.percent} threshold={t} />
              <span className="stat-sub">
                {pbl.attendance.attended} of {pbl.attendance.held} sessions
              </span>
            </>
          ) : (
            <span className="stat-sub">No PBL group yet</span>
          )}
        </div>

        <div className="card stat">
          <span className="stat-label">Below {t}%</span>
          <span className={`pct ${low.length ? 'bad' : 'good'}`}>{low.length}</span>
          <span className="stat-sub">{low.length ? low.map((s) => s.code).join(', ') : 'All subjects on track'}</span>
        </div>

        <div className="card stat">
          <span className="stat-label">Next PBL milestone</span>
          {next ? (
            <>
              <span className="pct neutral">{Math.max(0, daysUntil(next.due))}d</span>
              <span className="stat-sub">{next.title}</span>
            </>
          ) : (
            <span className="stat-sub">Nothing pending</span>
          )}
        </div>
      </div>

      <div className="cols">
        <section className="card">
          <h3>Needs attention</h3>
          {low.length === 0 && (!pbl || pbl.attendance.percent >= t) ? (
            <p className="empty">You're above {t}% everywhere. Keep it up.</p>
          ) : (
            <ul className="list">
              {low.map((s) => (
                <li key={s.code}>
                  <div>
                    <strong>{s.name}</strong>
                    <small>{advice(s, t)}</small>
                  </div>
                  <Percent value={s.percent} threshold={t} />
                </li>
              ))}
              {pbl && pbl.attendance.percent < t && (
                <li>
                  <div>
                    <strong>PBL sessions</strong>
                    <small>{advice(pbl.attendance, t, 'sessions')}</small>
                  </div>
                  <Percent value={pbl.attendance.percent} threshold={t} />
                </li>
              )}
            </ul>
          )}
        </section>

        <section className="card">
          <h3>Recent classes</h3>
          <ul className="list">
            {recent.map((r) => (
              <li key={r.subject + r.date}>
                <div>
                  <strong>{r.subject}</strong>
                  <small>{fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</small>
                </div>
                <span className={`chip ${r.status}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
