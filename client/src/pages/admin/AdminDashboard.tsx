import type { User } from '../../api';
import DashShell from '../DashShell';
import Settings from '../Settings';
import { useHashTab } from '../useHashTab';
import AdminOverview from './AdminOverview';
import Monitoring from './Monitoring';
import Users from './Users';
import Classes from './Classes';
import './admin.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '◆' },
  { id: 'monitoring', label: 'Monitoring', icon: '▲' },
  { id: 'users', label: 'Users', icon: '☺' },
  { id: 'classes', label: 'Classes', icon: '▦' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function AdminDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const tab = useHashTab(TABS.map((t) => t.id));
  return (
    <DashShell user={user} onLogout={onLogout} tabs={TABS} active={tab}>
      {tab === 'overview' ? (
        <AdminOverview />
      ) : tab === 'monitoring' ? (
        <Monitoring />
      ) : tab === 'users' ? (
        <Users />
      ) : tab === 'classes' ? (
        <Classes />
      ) : (
        <Settings user={user} />
      )}
    </DashShell>
  );
}
