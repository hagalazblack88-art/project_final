import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Post, Comment } from '../types';

const API_URL = 'http://localhost:8000';

interface Group {
  id: number;
  title: string;
}

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | string>('');
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null); // 🔥 Состояние для меню

  useEffect(() => {
    async function loadInitialData() {
      try {
        const postsRes = await fetch(`${API_URL}/posts/`, { credentials: 'include' });
        if (postsRes.ok) {
          const data = await postsRes.json();
          const fetchedPosts = data && data.items ? data.items : (Array.isArray(data) ? data : []);
          setPosts(fetchedPosts);
        }
        
        const groupsRes = await fetch(`${API_URL}/groups/`, { credentials: 'include' });
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          setGroups(Array.isArray(groupsData) ? groupsData : []);
        }
      } catch (error) {
        console.error('Ошибка инициализации ленты:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !newPostText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/posts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ text: newPostText, group_id: selectedGroupId ? Number(selectedGroupId) : null, image: null }),
        credentials: 'include'
      });

      if (response.ok) {
        const createdPost = await response.json();
        setPosts([{ ...createdPost, comments: [] }, ...posts]);
        setNewPostText('');
        setSelectedGroupId('');
      }
    } catch (error) {
      console.error('Ошибка создания поста:', error);
    }
  };

  const handleAddComment = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = commentInputs[postId];
    if (!user || !text || !text.trim()) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'include'
      });

      if (response.ok) {
        const newComment = await response.json();
        setPosts(posts.map(post => post.id === postId ? { ...post, comments: [...(post.comments || []), newComment] } : post));
        setCommentInputs({ ...commentInputs, [postId]: '' });
      }
    } catch (error) {
      console.error('Ошибка комментария:', error);
    }
  };

  const handleDeletePost = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Удалить эту публикацию?')) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId));
        setOpenMenuId(null); // Закрываем меню после удаления
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Удалить комментарий?')) return;

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) {
        setPosts(posts.map(post => post.id === postId ? { ...post, comments: (post.comments || []).filter(c => c.id !== commentId) } : post));
      }
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text)' }}>Загрузка ленты...</div>;

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <form onSubmit={handleCreatePost}>
          <textarea 
            placeholder="Что у вас нового?" 
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            style={styles.textarea}
          />
          <div style={styles.formFooter}>
            <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} style={styles.select}>
              <option value="">В мой профиль</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
            <button type="submit" style={styles.button} disabled={!newPostText.trim()}>Опубликовать</button>
          </div>
        </form>
      </div>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text)', marginTop: '40px' }}>Лента пуста</div>
      ) : (
        posts.map(post => (
          <div 
            key={post.id} 
            style={styles.card} 
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            <div style={styles.header}>
              <div style={styles.authorInfo}>
                <div style={styles.avatar}>{post.author?.username?.substring(0, 2).toUpperCase() || 'U'}</div>
                <div>
                  <Link 
                    to={`/profile/${post.author?.username}`} 
                    style={styles.authorName}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {post.author?.username || 'Пользователь'}
                  </Link>
                  <div style={styles.date}>{new Date(post.pub_date).toLocaleString()}</div>
                </div>
              </div>
              
              {/* 🔥 МЕНЮ ИЗ ТРЁХ ТОЧЕК */}
              {user && post.author_id === user.id && (
                <div className="post-menu-wrapper" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="post-menu-btn"
                    onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                    title="Действия с записью"
                  >
                    ⋮
                  </button>
                  
                  {openMenuId === post.id && (
                    <div className="post-dropdown">
                      <button 
                        className="post-dropdown-item delete"
                        onClick={(e) => handleDeletePost(post.id, e)}
                      >
                        🗑️ Удалить запись
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={styles.content}>
              <p style={styles.postText}>{post.text}</p>
            </div>

            <div style={styles.footer} onClick={(e) => e.stopPropagation()}>
              <div style={styles.actionBtn}>
                💬 <span>{(post.comments || []).length}</span>
              </div>
            </div>

            {(post.comments && post.comments.length > 0) && (
              <div style={styles.commentsPreview} onClick={(e) => e.stopPropagation()}>
                {post.comments.slice(0, 2).map((c: Comment) => {
                  const isMyComment = user && c.author?.id === user.id;
                  return (
                    <div key={c.id} className="mini-comment-wrapper">
                      <strong style={styles.miniCommentAuthor}>{c.author?.username}: </strong>
                      <span style={styles.miniCommentText}>{c.text}</span>
                      {isMyComment && (
                        <button 
                          onClick={(e) => handleDeleteComment(post.id, c.id, e)} 
                          className="mini-delete-btn"
                          title="Удалить комментарий"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {(post.comments.length > 2) && (
                  <div style={styles.showAllComments} onClick={() => navigate(`/posts/${post.id}`)}>
                    Показать все {post.comments.length} комментариев
                  </div>
                )}
                
                <div style={styles.quickCommentForm}>
                  <input 
                    type="text" 
                    placeholder="Написать комментарий..."
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    style={styles.inputSmall}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id, e as any)}
                  />
                  <button onClick={(e) => handleAddComment(post.id, e)} style={styles.sendBtn}>➤</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageContainer: { maxWidth: '700px', margin: '0 auto', padding: '0 10px', fontFamily: 'var(--sans)', color: 'var(--text-h)' },
  card: { 
    background: 'var(--bg)', 
    padding: '20px', 
    borderRadius: '12px', 
    border: '1px solid var(--border)',
    marginBottom: '16px',
    cursor: 'pointer',
    transition: 'background 0.2s, box-shadow 0.2s'
  },
  textarea: { 
    width: '100%', height: '70px', padding: '12px', borderRadius: '8px', 
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)',
    resize: 'none', boxSizing: 'border-box', fontSize: '15px', outline: 'none', marginBottom: '12px'
  },
  formFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-h)', fontSize: '13px', outline: 'none' },
  button: { padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', opacity: 1, transition: 'opacity 0.2s' },
  
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  authorInfo: { display: 'flex', gap: '12px', alignItems: 'center' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', flexShrink: 0 },
  authorName: { color: 'var(--text-h)', textDecoration: 'none', fontWeight: '600', fontSize: '15px', display: 'block' },
  date: { fontSize: '12px', color: 'var(--text)', marginTop: '2px' },
  
  content: { marginBottom: '16px' },
  postText: { fontSize: '15px', lineHeight: '1.5', margin: 0, color: 'var(--text-h)', whiteSpace: 'pre-wrap' },
  
  footer: { display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)', fontSize: '14px', cursor: 'pointer', fontWeight: '500' },
  
  commentsPreview: { marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' },
  miniCommentAuthor: { color: 'var(--accent)', fontWeight: '600', fontSize: '13px' },
  miniCommentText: { flex: 1, wordBreak: 'break-word' },
  showAllComments: { fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', marginBottom: '12px', fontWeight: '500' },
  
  quickCommentForm: { display: 'flex', gap: '8px', alignItems: 'center' },
  inputSmall: { flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--social-bg)', color: 'var(--text-h)', fontSize: '14px', outline: 'none' },
  sendBtn: { background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '18px', padding: '4px' }
};