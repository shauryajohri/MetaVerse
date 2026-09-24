import { useEffect, useState } from 'react';
import { type TeacherClass, type User, fetchTeacherClasses } from '../../api';
import DashShell from '../DashShell';
import MarkAttendance from './MarkAttendance';
import './teacher.css';

export default function TeacherDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [data, setData] = useState<{ threshold: number; classes: TeacherClass[] } | null>(null);
  const [error, setError] = useState('');

  const load = () =>
    fetchTeacherClasses()
      .then(setData)
      .catch((e: Error) => (e.message.startsWith('Session expired') ? onLogout() : setError(e.message)));
  useEffect(() => void load(), []);

  const pending = data?.classes.reduce((n, c) => n + c.pending, 0) ?? 0;
  const tabs = [{ id: 'attendance', label: 'Attendance', icon: '▦', badge: pending }];

  return (
    <DashShell user={user} onLogout={onLogout} tabs={tabs} active="attendance">
      {error ? (
        <section className="card">
          <h3>Couldn't load your classes</h3>
          <p className="empty">{error}</p>
        </section>
      ) : !data ? (
        <p className="loading blink">Loading your classes…</p>
      ) : data.classes.length === 0 ? (
        <section className="card">
          <h3>No classes yet</h3>
          <p className="empty">You aren't assigned to any class or PBL group. Ask the admin to assign you.</p>
        </section>
      ) : (
        <MarkAttendance classes={data.classes} threshold={data.threshold} onSaved={load} />
      )}
    </DashShell>
  );
}
