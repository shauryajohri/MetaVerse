import { useEffect, useState } from 'react';
import { type Attendance, type Pbl, type Profile, type User, fetchAttendance, fetchPbl, fetchProfile } from '../../api';
import DashShell from '../DashShell';
import { useHashTab } from '../useHashTab';
import Overview from './Overview';
import AttendanceView from './AttendanceView';
import PblView from './PblView';
import ProfileView from './ProfileView';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◆' },
  { id: 'attendance', label: 'Attendance', icon: '▦' },
  { id: 'pbl', label: 'PBL', icon: '⚑' },
  { id: 'profile', label: 'Profile', icon: '☺' },
];

interface Data {
  profile: Profile;
  attendance: Attendance;
  pbl: Pbl | null;
}

export default function StudentDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const tab = useHashTab(TABS.map((t) => t.id));
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([fetchProfile(), fetchAttendance(), fetchPbl().catch(() => null)])
      .then(([profile, attendance, pbl]) => setData({ profile, attendance, pbl }))
      .catch((e: Error) => (e.message.startsWith('Session expired') ? onLogout() : setError(e.message)));
  };
  useEffect(load, []);

  return (
    <DashShell user={user} onLogout={onLogout} tabs={TABS} active={tab}>
      {error ? (
        <section className="card">
          <h3>Couldn't load your records</h3>
          <p className="empty">{error}</p>
          <button className="btn-primary slim" onClick={load}>
            TRY AGAIN
          </button>
        </section>
      ) : !data ? (
        <p className="loading blink">Loading your records…</p>
      ) : tab === 'overview' ? (
        <Overview {...data} />
      ) : tab === 'attendance' ? (
        <AttendanceView attendance={data.attendance} />
      ) : tab === 'pbl' ? (
        <PblView pbl={data.pbl} />
      ) : (
        <ProfileView profile={data.profile} />
      )}
    </DashShell>
  );
}
