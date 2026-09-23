import { useEffect, useState } from 'react';
import PixelTown from './town/PixelTown';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { fetchMe, session, type User } from './api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(() => !!session.load());

  useEffect(() => {
    const token = session.load();
    if (!token) return;
    fetchMe(token)
      .then(({ user }) => setUser(user))
      .catch(() => session.clear())
      .finally(() => setChecking(false));
  }, []);

  const logout = () => {
    session.clear();
    setUser(null);
  };

  return (
    <>
      <PixelTown />
      <div className="vignette" />
      {!checking && (user ? <HomePage user={user} onLogout={logout} /> : <LoginPage onLogin={setUser} />)}
    </>
  );
}
