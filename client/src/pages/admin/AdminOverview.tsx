import { fetchAdminOverview, fetchStandings } from '../../api';
import { Bar, Percent } from '../student/ui';
import { useLoad } from './useLoad';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function AdminOverview() {
  const { data: o, error } = useLoad(fetchAdminOverview);
  const { data: s } = useLoad(fetchStandings);

  if (error) return <p className="loading">{error}</p>;
  if (!o) return <p className="loading blink">Loading…</p>;

  const atRisk = s ? [...s.students].sort((a, b) => a.overall - b.overall).slice(0, 6) : [];

  return (
    <>
      <header className="view-head">
        <h2>University overview</h2>
        <p>
          CSE · Semester 5 · {plural(o.counts.students, 'student')}, {plural(o.counts.teachers, 'teacher')}, {plural(o.counts.subjects, 'subject')},{' '}
          {plural(o.counts.pblGroups, 'PBL group')}
        </p>
      </header>

      <div className="stats">
        <div className="card stat">
          <span className="stat-label">Average attendance</span>
          <Percent value={o.averageAttendance} threshold={o.threshold} />
          <Bar percent={o.averageAttendance} threshold={o.threshold} />
          <span className="stat-sub">across all students and subjects</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Short in a subject</span>
          <span className={`pct ${o.withShortSubjects ? 'warn' : 'good'}`}>{o.withShortSubjects}</span>
          <span className="stat-sub">students below {o.threshold}% in at least one subject</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Below {o.threshold}% overall</span>
          <span className={`pct ${o.belowThreshold ? 'bad' : 'good'}`}>{o.belowThreshold}</span>
          <span className="stat-sub">students at risk of detention</span>
        </div>
        <div className="card stat">
          <span className="stat-label">Unassigned classes</span>
          <span className={`pct ${o.unassigned ? 'warn' : 'good'}`}>{o.unassigned}</span>
          <span className="stat-sub">
            subjects / PBL groups with no teacher account — <a href="#classes">assign</a>
          </span>
        </div>
      </div>

      <div className="cols">
        <section className="card">
          <h3>Lowest attendance</h3>
          {!s ? (
            <p className="empty blink">Loading…</p>
          ) : (
            <ul className="list">
              {atRisk.map((st) => (
                <li key={st.userId}>
                  <div>
                    <strong>{st.name}</strong>
                    <small>
                      {st.rollNo} · {st.short.length ? `short in ${st.short.map((x) => x.code).join(', ')}` : 'no subject below threshold'}
                    </small>
                  </div>
                  <Percent value={st.overall} threshold={o.threshold} />
                </li>
              ))}
            </ul>
          )}
          <a className="more" href="#monitoring">
            See all students →
          </a>
        </section>

        <section className="card">
          <h3>Attendance waiting to be marked</h3>
          {o.pendingByTeacher.length === 0 ? (
            <p className="empty">Every teacher is up to date.</p>
          ) : (
            <ul className="list">
              {o.pendingByTeacher.map((t) => (
                <li key={t.userId}>
                  <div>
                    <strong>{t.name}</strong>
                    <small>sessions not marked yet</small>
                  </div>
                  <span className="chip in-progress">{t.pending}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
