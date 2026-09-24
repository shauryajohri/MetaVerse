import { useMemo, useState } from 'react';
import { fetchStandings } from '../../api';
import { Percent } from '../student/ui';
import { useLoad } from './useLoad';

const THRESHOLD = 75;

export default function Monitoring() {
  const { data, error } = useLoad(fetchStandings);
  const [q, setQ] = useState('');
  const [onlyShort, setOnlyShort] = useState(true);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.students ?? [])
      .filter((s) => !onlyShort || s.short.length || s.overall < THRESHOLD || (s.pbl ?? 100) < THRESHOLD)
      .filter((s) => !needle || s.name.toLowerCase().includes(needle) || s.rollNo.toLowerCase().includes(needle))
      .sort((a, b) => a.overall - b.overall);
  }, [data, q, onlyShort]);

  return (
    <>
      <header className="view-head">
        <h2>Attendance monitoring</h2>
        <p>Students sorted by overall attendance, lowest first. Minimum is {THRESHOLD}% per subject.</p>
      </header>

      <section className="card flush">
        <div className="toolbar">
          <input className="search" placeholder="Search name or roll number" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
          <label className="check">
            <input type="checkbox" checked={onlyShort} onChange={(e) => setOnlyShort(e.target.checked)} />
            <span className="box" aria-hidden />
            Only students who need attention
          </label>
          <span className="count">{data ? `${rows.length} of ${data.students.length}` : ''}</span>
        </div>

        {error ? (
          <p className="loading-inline">{error}</p>
        ) : !data ? (
          <p className="loading-inline blink">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="loading-inline">Nobody matches. {onlyShort && 'Everyone is above the threshold.'}</p>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>PBL</th>
                <th className="num">Overall</th>
                <th className="num">PBL att.</th>
                <th>Short in</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.userId}>
                  <td>
                    <strong>{s.name}</strong>
                    <small>
                      {s.rollNo} · CSE {s.section}
                    </small>
                  </td>
                  <td>{s.pblGroup ?? '—'}</td>
                  <td className="num">
                    <Percent value={s.overall} threshold={THRESHOLD} />
                  </td>
                  <td className="num">{s.pbl === null ? '—' : <Percent value={s.pbl} threshold={THRESHOLD} />}</td>
                  <td>
                    <div className="short-list">
                      {s.short.length === 0 ? (
                        <span className="muted-inline">—</span>
                      ) : (
                        s.short.map((x) => (
                          <span key={x.code} className="chip absent" title={`${x.name}: needs the next ${x.mustAttend} classes`}>
                            {x.code} · {x.percent}%
                          </span>
                        ))
                      )}
                    </div>
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
