import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';

const API_URL = 'http://localhost:8000';

interface ProfileData {
  author: {
    id: number;
    username: string;
    email: string;
  };
  posts: {
    items: Post[];
    total: number;
  };
  is_following: boolean;
  total_posts: number;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!username) return;
      try {
        const response = await fetch(`${API_URL}/profile/${username}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setIsFollowing(data.is_following);
        }
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  const handleToggleFollow = async () => {
    if (!username) return;
    
    // 🔥 Используем твой существующий эндпоинт /profile/{username}/follow/
    const method = isFollowing ? 'DELETE' : 'POST';
    try {
      const response = await fetch(`${API_URL}/profile/${username}/follow/`, {
        method,
        credentials: 'include',
      });

      if (response.ok) {
        // Мгновенно обновляем состояние кнопки без перезагрузки
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Ошибка изменения подписки:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text)' }}>Загрузка профиля...</div>;
  }

  if (!profile) {
    return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text)' }}>Пользователь не найден</div>;
  }

  const isOwnProfile = user?.username === profile.author.username;

  return (
    <div style={styles.container}>
      {/* Шапка профиля */}
      <div style={styles.card}>
        <div style={styles.profileHeader}>
          <div style={styles.avatarLarge}>
            {profile.author.username.substring(0, 2).toUpperCase()}
          </div>
          <div style={styles.profileInfo}>
            <h1 style={styles.profileName}>{profile.author.username}</h1>
            <p style={styles.profileUsername}>@{profile.author.username}</p>
            
            <div style={styles.profileStats}>
              <div style={styles.statItem}>
                <span style={styles.statValue}>{profile.total_posts}</span>
                <span style={styles.statLabel}>публикаций</span>
              </div>
            </div>

            {/* 🔥 Кнопка подписки (не показываем на собственном профиле) */}
            {!isOwnProfile && (
              <button 
                onClick={handleToggleFollow} 
                style={isFollowing ? styles.unfollowBtn : styles.followBtn}
              >
                {isFollowing ? '✓ Вы подписаны' : '+ Подписаться'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Лента постов пользователя */}
      <div style={styles.sectionTitle}>
        Все записи
      </div>

      {profile.posts.items.length === 0 ? (
        <div style={styles.emptyState}>
          У пользователя пока нет публикаций
        </div>
      ) : (
        profile.posts.items.map((post) => (
          <Link key={post.id} to={`/posts/${post.id}`} style={styles.postCard}>
            <div style={styles.postHeader}>
              <div style={styles.avatarSmall}>
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
  card: {
    background: 'var(--bg)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    marginBottom: '20px'
  },
  profileHeader: { display: 'flex', gap: '24px', alignItems: 'flex-start' },
  avatarLarge: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  profileInfo: { flex: 1, paddingTop: '8px' },
  profileName: { fontSize: '24px', fontWeight: '700', color: 'var(--text-h)', margin: '0 0 4px 0' },
  profileUsername: { fontSize: '15px', color: 'var(--text)', margin: '0 0 16px 0' },
  profileStats: { display: 'flex', gap: '24px', marginBottom: '20px' },
  statItem: { display: 'flex', flexDirection: 'column' },
  statValue: { fontSize: '18px', fontWeight: '700', color: 'var(--text-h)' },
  statLabel: { fontSize: '13px', color: 'var(--text)' },
  
  followBtn: {
    padding: '10px 24px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'opacity 0.2s'
  },
  unfollowBtn: {
    padding: '10px 24px',
    background: 'var(--social-bg)',
    color: 'var(--text-h)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    transition: 'background 0.2s'
  },

  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-h)',
    marginBottom: '12px',
    paddingLeft: '4px'
  },
  emptyState: {
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
  avatarSmall: {
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