import { useState } from 'react';
import type { Attendance } from '../../api';
import { Bar, Dots, Percent, advice, fmtDate, tone } from './ui';

export default function AttendanceView({ attendance }: { attendance: Attendance }) {
  const t = attendance.threshold;
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <header className="view-head">
        <h2>Class attendance</h2>
        <p>
          Overall <Percent value={attendance.overall.percent} threshold={t} /> · {attendance.overall.attended} of {attendance.overall.held} classes ·
          minimum {t}% per subject
        </p>
      </header>

      <section className="card flush">
        <div className="att-row att-head">
          <span>Subject</span>
          <span>Attended</span>
          <span>Progress</span>
          <span>Last 12</span>
        </div>
        {attendance.subjects.map((s) => (
          <div key={s.code} className={`att-item ${tone(s.percent, t)}`}>
            <button className="att-row" onClick={() => setOpen(open === s.code ? null : s.code)} aria-expanded={open === s.code}>
              <span className="att-subject">
                <strong>{s.name}</strong>
                <small>
                  {s.code} · {s.faculty}
                </small>
              </span>
              <span className="att-count">
                <Percent value={s.percent} threshold={t} />
                <small>
                  {s.attended}/{s.held}
                </small>
              </span>
              <span className="att-progress">
                <Bar percent={s.percent} threshold={t} />
                <small>{advice(s, t)}</small>
              </span>
              <Dots records={s.records} />
            </button>
            {open === s.code && (
              <div className="att-history">
                {[...s.records].reverse().map((r) => (
                  <span key={r.date} className={`chip ${r.status}`} title={r.source === 'erp' ? 'Imported from GEHU ERP' : 'Marked in METAVERSE'}>
                    {fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
