import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000';

interface Group {
  id: number;
  title: string;
  description: string;
  slug: string;
  owner_id: number;
}

export default function GroupsPage() {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    async function loadGroups() {
      try {
        const response = await fetch(`${API_URL}/groups/`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setGroups(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Ошибка загрузки сообществ:', error);
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;

    try {
      const response = await fetch(`${API_URL}/groups/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGroupTitle,
          description: newGroupDescription
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups([newGroup, ...groups]);
        setShowCreateForm(false);
        setNewGroupTitle('');
        setNewGroupDescription('');
        navigate(`/groups/${newGroup.slug}`);
      } else {
        const error = await response.json();
        alert(error.detail || 'Ошибка создания сообщества');
      }
    } catch (error) {
      console.error('Ошибка создания сообщества:', error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text)' }}>Загрузка...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>👥 Сообщества</h1>
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={styles.createBtn}>
          {showCreateForm ? '✕ Отмена' : '+ Создать сообщество'}
        </button>
      </div>

      {showCreateForm && (
        <div style={styles.card}>
          <h2 style={styles.formTitle}>Новое сообщество</h2>
          <form onSubmit={handleCreateGroup}>
            <input
              type="text"
              placeholder="Название сообщества"
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              style={styles.input}
              required
            />
            <textarea
              placeholder="Описание (необязательно)"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              style={styles.textarea}
            />
            <button type="submit" style={styles.submitBtn} disabled={!newGroupTitle.trim()}>
              Создать
            </button>
          </form>
        </div>
      )}

      {groups.length === 0 ? (
        <div style={styles.empty}>
          <p>Пока нет сообществ. Будьте первым, кто создаст одно!</p>
        </div>
      ) : (
        <div style={styles.groupsList}>
          {groups.map(group => (
            <Link key={group.id} to={`/groups/${group.slug}`} style={styles.groupCard}>
              <div style={styles.groupAvatar}>
                {group.title.substring(0, 2).toUpperCase()}
              </div>
              <div style={styles.groupInfo}>
                <h3 style={styles.groupTitle}>{group.title}</h3>
                {group.description && <p style={styles.groupDescription}>{group.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '700px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: '700', color: 'var(--text-h)', margin: 0 },
  createBtn: {
    padding: '10px 20px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  },
  card: {
    background: 'var(--bg)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    marginBottom: '20px'
  },
  formTitle: { fontSize: '18px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '16px', marginTop: 0 },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontSize: '15px',
    marginBottom: '12px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontSize: '15px',
    marginBottom: '12px',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '80px'
  },
  submitBtn: {
    padding: '10px 20px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'var(--bg)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    color: 'var(--text)'
  },
  groupsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  groupCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'var(--bg)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    textDecoration: 'none',
    color: 'var(--text-h)',
    transition: 'box-shadow 0.2s'
  },
  groupAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  groupInfo: { flex: 1 },
  groupTitle: { fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' },
  groupDescription: { fontSize: '14px', color: 'var(--text)', margin: 0, lineHeight: '1.4' }
};