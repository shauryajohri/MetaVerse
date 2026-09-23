import type { Pbl } from '../../api';
import { Bar, Percent, advice, daysUntil, fmtDate } from './ui';

const STATUS_LABEL = { completed: 'Done', 'in-progress': 'In progress', upcoming: 'Upcoming' };

export default function PblView({ pbl }: { pbl: Pbl | null }) {
  if (!pbl) {
    return (
      <section className="card">
        <h3>Project Based Learning</h3>
        <p className="empty">You haven't been added to a PBL group yet. Your mentor will assign one.</p>
      </section>
    );
  }
  const a = pbl.attendance;

  return (
    <>
      <header className="view-head">
        <h2>Project Based Learning</h2>
        <p>
          Group {pbl.id} · Mentor {pbl.mentor.name}
        </p>
      </header>

      <div className="cols">
        <section className="card">
          <span className="eyebrow">{pbl.project.domain}</span>
          <h3 className="project-title">{pbl.project.title}</h3>
          <p className="muted-text">{pbl.project.summary}</p>
          <h4>Team</h4>
          <ul className="list compact">
            {pbl.members.map((m) => (
              <li key={m.rollNo} className={m.you ? 'you' : undefined}>
                <div>
                  <strong>
                    {m.name}
                    {m.you && <span className="tag">You</span>}
                  </strong>
                  <small>
                    {m.rollNo} · {m.role}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h3>PBL attendance</h3>
          <div className="pbl-att">
            <Percent value={a.percent} threshold={a.threshold} />
            <span>
              {a.attended} of {a.held} sessions
            </span>
          </div>
          <Bar percent={a.percent} threshold={a.threshold} />
          <p className="muted-text">{advice(a, a.threshold, 'sessions')}</p>
          <ul className="list compact">
            {[...a.sessions].reverse().map((s) => (
              <li key={s.date}>
                <div>
                  <strong>{s.topic}</strong>
                  <small>{fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</small>
                </div>
                <span className={`chip ${s.status}`}>{s.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h3>Milestones</h3>
        <ol className="timeline">
          {pbl.milestones.map((m) => {
            const d = daysUntil(m.due);
            return (
              <li key={m.title} className={m.status}>
                <span className="node" aria-hidden />
                <div className="tl-body">
                  <div className="tl-top">
                    <strong>{m.title}</strong>
                    <span className={`chip ${m.status}`}>{STATUS_LABEL[m.status]}</span>
                  </div>
                  <small>
                    Due {fmtDate(m.due, { day: 'numeric', month: 'short', year: 'numeric' })}
                    {m.status !== 'completed' && (d >= 0 ? ` · in ${d} days` : ` · ${-d} days overdue`)}
                  </small>
                  {m.remarks && <p className="remark">Mentor: “{m.remarks}”</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
