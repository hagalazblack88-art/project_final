import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8000';

interface Group {
  id: number;
  title: string;
  slug: string;
  description: string;
}

export default function GroupsSidebar() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch(`${API_URL}/groups/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setGroups(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки групп:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, []);

  if (loading) return <div style={styles.sidebar}>Загрузка групп...</div>;

  return (
    <div style={styles.sidebar}>
      <h3 style={styles.title}>👥 Сообщества</h3>
      {groups.length === 0 ? (
        <p style={{ color: '#666', fontSize: '14px' }}>Групп пока нет</p>
      ) : (
        <ul style={styles.list}>
          {groups.map(group => (
            <li key={group.id} style={styles.item} title={group.description}>
              <strong style={styles.groupTitle}># {group.title}</strong>
              <span style={styles.slug}>{group.slug}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: { 
    width: '240px', 
    background: 'var(--bg)', 
    padding: '20px', 
    borderRadius: '12px', 
    boxShadow: 'var(--shadow)', 
    alignSelf: 'flex-start',
    border: '1px solid var(--border)',
    position: 'sticky',
    top: '20px' // Чтобы сайдбар "прилипал" при скролле (как в VK)
  },
  sidebarError: { 
    width: '240px', 
    background: 'rgba(239, 68, 68, 0.1)', 
    color: '#ef4444', 
    padding: '20px', 
    borderRadius: '12px', 
    fontSize: '14px',
    border: '1px solid rgba(239, 68, 68, 0.3)'
  },
  title: { marginTop: 0, marginBottom: '16px', fontSize: '16px', color: 'var(--text)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  item: { padding: 0, borderRadius: '8px', transition: 'background 0.2s' },
  link: { 
    display: 'flex', 
    flexDirection: 'column', 
    padding: '10px 12px', 
    textDecoration: 'none', 
    color: 'inherit',
    borderRadius: '8px'
  },
  groupTitle: { fontSize: '14px', color: 'var(--text-h)', fontWeight: '500' },
  slug: { fontSize: '12px', color: 'var(--text)', marginTop: '2px' }
};

// Добавь этот хук в сам компонент, чтобы подсвечивать группу при наведении:
// onMouseEnter={(e) => e.currentTarget.style.background = 'var(--social-bg)'}
// onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}