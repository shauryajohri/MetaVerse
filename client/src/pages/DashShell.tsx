import type { ReactNode } from 'react';
import type { User } from '../api';
import './student/dashboard.css';

export interface NavTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

/** Top bar + side nav shared by the student and teacher dashboards. Tabs are hash links (#id). */
export default function DashShell({
  user,
  onLogout,
  tabs,
  active,
  children,
}: {
  user: User;
  onLogout: () => void;
  tabs: NavTab[];
  active: string;
  children: ReactNode;
}) {
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
            <small>
              {user.rollNo} · {user.role}
            </small>
          </span>
          <button className="btn-ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <nav className="sidenav" aria-label="Sections">
        {tabs.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={active === t.id ? 'active' : undefined} aria-current={active === t.id ? 'page' : undefined}>
            <span className="ico" aria-hidden>
              {t.icon}
            </span>
            {t.label}
            {!!t.badge && <span className="nav-badge">{t.badge}</span>}
          </a>
        ))}
        <div className="nav-foot">Campus world · coming soon</div>
      </nav>

      <main className="content">{children}</main>
    </div>
  );
}
