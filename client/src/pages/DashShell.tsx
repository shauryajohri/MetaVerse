import { type ReactNode, useEffect } from 'react';
import type { User } from '../api';
import './student/dashboard.css';

export interface NavTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

/**
 * Top bar + side nav shared by the dashboards. Tabs are hash links (#id).
 *
 * With `home` set, the shell floats over the campus map instead of covering it: the `home` tab
 * shows the bare map, every other tab opens its content in a panel beside the nav.
 */
export default function DashShell({
  user,
  onLogout,
  tabs,
  active,
  home,
  children,
}: {
  user: User;
  onLogout: () => void;
  tabs: NavTab[];
  active: string;
  home?: string;
  children: ReactNode;
}) {
  const open = !home || active !== home;

  useEffect(() => {
    if (!home || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') location.hash = home;
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [home, open]);

  return (
    <div className={home ? 'dash overlay' : 'dash'}>
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
          <a
            key={t.id}
            // over the map, picking the open section again closes it
            href={`#${home && active === t.id ? home : t.id}`}
            className={active === t.id ? 'active' : undefined}
            aria-current={active === t.id ? 'page' : undefined}
          >
            <span className="ico" aria-hidden>
              {t.icon}
            </span>
            {t.label}
            {!!t.badge && <span className="nav-badge">{t.badge}</span>}
          </a>
        ))}
        <div className="nav-foot">Campus world · coming soon</div>
      </nav>

      {open && (
        <main className={home ? 'content panel' : 'content'}>
          {home && (
            <a className="btn-ghost panel-close" href={`#${home}`} aria-label="Close panel" title="Close (Esc)">
              ✕
            </a>
          )}
          {children}
        </main>
      )}
    </div>
  );
}
