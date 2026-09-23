import type { User } from '../api';

const ENTRY = {
  student: 'The campus world is under construction. Soon you’ll drop straight into it from here.',
  teacher: 'Your class console will live here: sessions, rosters and routed doubts.',
  admin: 'The institution dashboard will live here: users, departments and analytics.',
};

// Placeholder until the role-specific entry experiences exist.
export default function HomePage({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <main className="login-screen">
      <section className="panel login-panel">
        <div className="panel-tab">{user.role.toUpperCase()}</div>
        <h1 className="title">Hi, {user.name.split(' ')[0]}!</h1>
        <p className="lede">
          Signed in as <strong>{user.rollNo}</strong>.
        </p>
        <p className="lede">{ENTRY[user.role]}</p>
        <button className="btn-primary" onClick={onLogout}>
          LOG OUT
        </button>
      </section>
    </main>
  );
}
