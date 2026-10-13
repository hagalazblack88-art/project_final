import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';

const API_URL = 'http://localhost:8000';

interface Group {
  id: number;
  title: string;
  description: string;
  slug: string;
  owner_id: number;
}

export default function GroupDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');

  useEffect(() => {
    async function loadGroupData() {
      if (!slug) return;
      try {
        const response = await fetch(`${API_URL}/groups/${slug}/`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setGroup(data.group);
          setPosts(data.posts?.items || []);
        }
      } catch (error) {
        console.error('Ошибка загрузки сообщества:', error);
      } finally {
        setLoading(false);
      }
    }
    loadGroupData();
  }, [slug]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPostText.trim() || !group) return;

    try {
      const response = await fetch(`${API_URL}/posts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newPostText,
          group_id: group.id,
          image: null
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([{ ...newPost, comments: [] }, ...posts]);
        setNewPostText('');
      }
    } catch (error) {
      console.error('Ошибка создания поста:', error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text)' }}>Загрузка...</div>;
  if (!group) return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text)' }}>Сообщество не найдено</div>;

  return (
    <div style={styles.container}>
      <Link to="/groups" style={styles.backLink}>← Все сообщества</Link>
      
      <div style={styles.groupHeader}>
        <div style={styles.groupAvatar}>
          {group.title.substring(0, 2).toUpperCase()}
        </div>
        <div style={styles.groupInfo}>
          <h1 style={styles.groupTitle}>{group.title}</h1>
          {group.description && <p style={styles.groupDescription}>{group.description}</p>}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.formTitle}>Написать в сообщество</h3>
        <form onSubmit={handleCreatePost}>
          <textarea
            placeholder="Что нового в сообществе?"
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            style={styles.textarea}
          />
          <button type="submit" style={styles.submitBtn} disabled={!newPostText.trim()}>
            Опубликовать
          </button>
        </form>
      </div>

      {posts.length === 0 ? (
        <div style={styles.empty}>В этом сообществе пока нет публикаций</div>
      ) : (
        posts.map(post => (
          <Link key={post.id} to={`/posts/${post.id}`} style={styles.postCard}>
            <div style={styles.postHeader}>
              <div style={styles.avatar}>
                {post.author?.username?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div>
                <div style={styles.authorName}>{post.author?.username || 'Пользователь'}</div>
                <div style={styles.date}>{new Date(post.pub_date).toLocaleString()}</div>
              </div>
            </div>
            <p style={styles.postText}>{post.text}</p>
            <div style={styles.postFooter}>
              💬 {(post.comments || []).length} комментариев
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '700px', margin: '0 auto' },
  backLink: { color: 'var(--accent)', textDecoration: 'none', fontSize: '14px', marginBottom: '16px', display: 'inline-block' },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '24px',
    background: 'var(--bg)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    marginBottom: '20px'
  },
  groupAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '16px',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  groupInfo: { flex: 1 },
  groupTitle: { fontSize: '24px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 8px 0' },
  groupDescription: { fontSize: '15px', color: 'var(--text)', margin: 0, lineHeight: '1.5' },
  card: {
    background: 'var(--bg)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    marginBottom: '20px'
  },
  formTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--text-h)', marginBottom: '12px', marginTop: 0 },
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
    padding: '40px',
    background: 'var(--bg)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    color: 'var(--text)'
  },
  postCard: {
    display: 'block',
    padding: '20px',
    background: 'var(--bg)',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    marginBottom: '12px',
    textDecoration: 'none',
    color: 'var(--text-h)',
    transition: 'box-shadow 0.2s'
  },
  postHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
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
    fontWeight: 'bold'
  },
  authorName: { fontWeight: '600', fontSize: '15px' },
  date: { fontSize: '12px', color: 'var(--text)', marginTop: '2px' },
  postText: { fontSize: '15px', lineHeight: '1.5', margin: '0 0 12px 0', whiteSpace: 'pre-wrap' },
  postFooter: { fontSize: '13px', color: 'var(--text)', paddingTop: '12px', borderTop: '1px solid var(--border)' }
};