import { useEffect, useState } from 'react';
import PixelTown from './town/PixelTown';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
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
      {!checking &&
        (!user ? (
          <LoginPage onLogin={setUser} />
        ) : user.role === 'student' ? (
          <StudentDashboard user={user} onLogout={logout} />
        ) : user.role === 'teacher' ? (
          <TeacherDashboard user={user} onLogout={logout} />
        ) : (
          <AdminDashboard user={user} onLogout={logout} />
        ))}
    </>
  );
}
