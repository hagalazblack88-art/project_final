import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  // Функция для проверки активного пункта меню
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside style={styles.sidebar}>
      {/* Блок пользователя сверху */}
      <Link to={`/profile/${user.username}`} style={styles.userBlock}>
        <div style={styles.avatar}>
          {user.username?.substring(0, 2).toUpperCase() || 'U'}
        </div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user.username}</div>
          <div style={styles.userStatus}>онлайн</div>
        </div>
      </Link>

      <nav style={styles.nav}>
        <Link 
          to="/" 
          style={isActive('/') ? styles.navLinkActive : styles.navLink}
        >
          <span style={styles.icon}>📰</span> Новости (Лента)
        </Link>
        
        <Link 
          to={`/profile/${user.username}`} 
          style={location.pathname.startsWith('/profile') ? styles.navLinkActive : styles.navLink}
        >
          <span style={styles.icon}>👤</span> Моя страница
        </Link>
        
        <Link 
          to="/groups" 
          style={location.pathname.startsWith('/groups') ? styles.navLinkActive : styles.navLink}
        >
          <span style={styles.icon}>👥</span> Сообщества
        </Link>
      </nav>

      <div style={styles.footer}>
        <button onClick={logout} style={styles.logoutBtn}>
          <span style={styles.icon}>🚪</span> Выйти
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '220px',
    position: 'sticky',
    top: '20px',
    height: 'fit-content',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    textDecoration: 'none',
    color: 'var(--text-h)',
    transition: 'background 0.2s',
    marginBottom: '16px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontWeight: '600', fontSize: '15px' },
  userStatus: { fontSize: '12px', color: 'var(--text)', marginTop: '2px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px' },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'var(--text-h)',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'background 0.2s',
  },
  navLinkActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'var(--accent)',
    background: 'var(--social-bg)',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'background 0.2s',
  },
  icon: { fontSize: '18px', width: '24px', textAlign: 'center' },
  footer: { marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background 0.2s',
  },
};