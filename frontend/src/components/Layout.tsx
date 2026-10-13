import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, loading } = useAuth();

  // Если загрузка ещё идёт, показываем индикатор
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text)' }}>Загрузка...</div>;
  }

  // Если пользователь не авторизован, перенаправляем на вход (предполагается, что у тебя есть маршрут /login)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={styles.wrapper}>
      <Sidebar />
      <main style={styles.main}>
        <Outlet /> {/* Здесь будут рендериться FeedPage, ProfilePage и т.д. */}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    maxWidth: '960px', // Стандартная ширина контента как в VK
    margin: '0 auto',
    padding: '20px 10px',
    gap: '20px',
    alignItems: 'flex-start',
  },
  main: {
    flex: 1,
    maxWidth: '600px', // Ширина ленты
    width: '100%',
  },
};