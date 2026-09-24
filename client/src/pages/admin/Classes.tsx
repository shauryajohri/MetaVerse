import { useState } from 'react';
import { assignTeacher, fetchAdminClasses } from '../../api';
import { useLoad } from './useLoad';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function TeacherSelect({
  value,
  label,
  teachers,
  onChange,
}: {
  value: number | null;
  label: string;
  teachers: { id: number; name: string; rollNo: string }[];
  onChange: (id: number | null) => void;
}) {
  return (
    <select className="inline-select" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} aria-label={label}>
      <option value="">— No teacher account —</option>
      {teachers.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name} ({t.rollNo})
        </option>
      ))}
    </select>
  );
}

export default function Classes() {
  const { data, setData, error } = useLoad(fetchAdminClasses);
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const assign = async (kind: 'subject' | 'pbl', id: string, label: string, teacherId: number | null) => {
    try {
      const res = await assignTeacher(kind, id, teacherId);
      setData((d) => d && { ...d, ...res });
      const t = data?.teachers.find((x) => x.id === teacherId);
      setNote({ kind: 'ok', text: t ? `${label} is now assigned to ${t.name}.` : `${label} no longer has a teacher account.` });
    } catch (e) {
      setNote({ kind: 'err', text: (e as Error).message });
    }
  };

  if (error) return <p className="loading">{error}</p>;
  if (!data) return <p className="loading blink">Loading…</p>;

  return (
    <>
      <header className="view-head">
        <h2>Classes & PBL groups</h2>
        <p>Assign a teacher account to each class and PBL group. Only the assigned teacher can mark its attendance.</p>
      </header>

      {note && (
        <p className={`banner ${note.kind}`} role="status">
          {note.text}
        </p>
      )}

      <section className="card flush">
        <h3 className="tbl-title">Subjects · CSE 5th sem, section A</h3>
        <table className="tbl">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Schedule</th>
              <th>Teacher</th>
              <th className="num">To mark</th>
            </tr>
          </thead>
          <tbody>
            {data.subjects.map((s) => (
              <tr key={s.code}>
                <td>
                  <strong>{s.name}</strong>
                  <small>{s.code}</small>
                </td>
                <td className="muted-inline">{s.days.map((d) => DAY[d]).join(', ')}</td>
                <td>
                  <TeacherSelect value={s.teacherId} label={`Teacher for ${s.name}`} teachers={data.teachers} onChange={(id) => assign('subject', s.code, s.name, id)} />
                  {!s.teacherId && <small>Shown to students as: {s.faculty}</small>}
                </td>
                <td className="num">{s.pending ? <span className="chip in-progress">{s.pending}</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card flush">
        <h3 className="tbl-title">PBL groups</h3>
        <table className="tbl">
          <thead>
            <tr>
              <th>Group</th>
              <th>Members</th>
              <th>Mentor</th>
              <th className="num">To mark</th>
            </tr>
          </thead>
          <tbody>
            {data.pblGroups.map((g) => (
              <tr key={g.id}>
                <td>
                  <strong>{g.id}</strong>
                  <small>{g.title}</small>
                </td>
                <td className="muted-inline">{g.members.join(', ')}</td>
                <td>
                  <TeacherSelect value={g.mentorId} label={`Mentor for group ${g.id}`} teachers={data.teachers} onChange={(id) => assign('pbl', g.id, `Group ${g.id}`, id)} />
                  {!g.mentorId && <small>Shown to students as: {g.mentor}</small>}
                </td>
                <td className="num">{g.pending ? <span className="chip in-progress">{g.pending}</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
