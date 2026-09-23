import { useEffect, useState } from 'react';
import { type Attendance, type Pbl, type Profile, type User, fetchAttendance, fetchPbl, fetchProfile } from '../../api';
import Overview from './Overview';
import AttendanceView from './AttendanceView';
import PblView from './PblView';
import ProfileView from './ProfileView';
import './dashboard.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◆' },
  { id: 'attendance', label: 'Attendance', icon: '▦' },
  { id: 'pbl', label: 'PBL', icon: '⚑' },
  { id: 'profile', label: 'Profile', icon: '☺' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const tabFromHash = (): Tab => TABS.find((t) => `#${t.id}` === location.hash)?.id ?? 'overview';

interface Data {
  profile: Profile;
  attendance: Attendance;
  pbl: Pbl | null;
}

export default function StudentDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const load = () => {
    setError('');
    Promise.all([fetchProfile(), fetchAttendance(), fetchPbl().catch(() => null)])
      .then(([profile, attendance, pbl]) => setData({ profile, attendance, pbl }))
      .catch((e: Error) => (e.message.startsWith('Session expired') ? onLogout() : setError(e.message)));
  };
  useEffect(load, []);

  return (
    <div className="dash">
      <header className="topbar">
        <div className="brand small">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">METAVERSE</span>
        </div>
        <div className="who">
          <span>
            <strong>{user.name}</strong>
            <small>{user.rollNo}</small>
          </span>
          <button className="btn-ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <nav className="sidenav" aria-label="Sections">
        {TABS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={tab === t.id ? 'active' : undefined} aria-current={tab === t.id ? 'page' : undefined}>
            <span className="ico" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </a>
        ))}
        <div className="nav-foot">Campus world · coming soon</div>
      </nav>

      <main className="content">
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
      </main>
    </div>
  );
}
