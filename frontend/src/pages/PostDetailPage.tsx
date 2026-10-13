import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Post, Comment } from '../types';

const API_URL = 'http://localhost:8000';

interface PostDetailData {
  post: Post;
  author_post_count: number;
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postData, setPostData] = useState<PostDetailData | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 🔥 Состояние для меню

  useEffect(() => {
    async function fetchPostDetail() {
      if (!postId) return;
      try {
        const response = await fetch(`${API_URL}/posts/${postId}`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setPostData(data);
        }
      } catch (error) {
        console.error('Ошибка загрузки поста:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPostDetail();
  }, [postId]);

  const handleAddComment = async () => {
    if (!user || !commentText.trim() || !postId) return;
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
        credentials: 'include',
      });
      if (response.ok) {
        const newComment = await response.json();
        setPostData(prev => prev ? {
          ...prev,
          post: { ...prev.post, comments: [...(prev.post.comments || []), newComment] }
        } : null);
        setCommentText('');
      }
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!postId || !window.confirm('Удалить эту публикацию?')) return;
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error('Ошибка удаления поста:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!postId || !window.confirm('Удалить комментарий?')) return;
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) {
        setPostData(prev => prev ? {
          ...prev,
          post: { ...prev.post, comments: (prev.post.comments || []).filter(c => c.id !== commentId) }
        } : null);
      }
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text)' }}>Загрузка...</div>;
  if (!postData) return <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text)' }}>Пост не найден</div>;

  const { post, author_post_count } = postData;
  const isAuthor = user && post.author_id === user.id;

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>← Назад к ленте</Link>
      
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatar}>
            {post.author?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <Link to={`/profile/${post.author?.username}`} style={styles.authorName}>
              {post.author?.username || 'Пользователь'}
            </Link>
            <div style={styles.date}>{new Date(post.pub_date).toLocaleString()}</div>
          </div>
          
          {/* 🔥 МЕНЮ ИЗ ТРЁХ ТОЧЕК */}
          {isAuthor && (
            <div className="post-menu-wrapper">
              <button 
                className="post-menu-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Действия с записью"
              >
                ⋮
              </button>
              
              {isMenuOpen && (
                <div className="post-dropdown">
                  <button 
                    className="post-dropdown-item delete"
                    onClick={() => {
                      handleDeletePost();
                      setIsMenuOpen(false);
                    }}
                  >
                    🗑️ Удалить запись
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <p style={styles.postText}>{post.text}</p>
        
        {post.image && (
          <img src={post.image} alt="Post" style={styles.image} />
        )}
        
        <div style={styles.stats}>
          📝 Всего публикаций автора: <strong>{author_post_count}</strong>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.commentsTitle}>
          Комментарии <span style={styles.commentsCount}>({(post.comments || []).length})</span>
        </h3>
        
        <div style={styles.commentForm}>
          <div style={styles.commentFormAvatar}>
            {user?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <input
            type="text"
            placeholder="Написать комментарий..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={styles.input}
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <button 
            onClick={handleAddComment} 
            style={styles.button}
            disabled={!commentText.trim()}
          >
            Отправить
          </button>
        </div>

        <div style={styles.commentsList}>
          {(post.comments || []).length === 0 ? (
            <div style={styles.emptyComments}>Пока нет комментариев. Будьте первым!</div>
          ) : (
            (post.comments || []).map((comment: Comment) => {
              const isCommentAuthor = user && comment.author?.id === user.id;
              return (
                <div key={comment.id} className="comment-bubble">
                  <div style={styles.commentAvatar}>
                    {comment.author?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div style={styles.commentContent}>
                    <div style={styles.commentHeader}>
                      <Link to={`/profile/${comment.author?.username}`} style={styles.commentAuthorName}>
                        {comment.author?.username || 'Пользователь'}
                      </Link>
                      <span style={styles.commentDate}>
                        {new Date(comment.pub_date).toLocaleString()}
                      </span>
                    </div>
                    <p style={styles.commentText}>{comment.text}</p>
                  </div>
                  
                  {isCommentAuthor && (
                    <button 
                      onClick={() => handleDeleteComment(comment.id)} 
                      className="delete-comment-icon"
                      title="Удалить комментарий"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '0 10px', color: 'var(--text-h)' },
  backLink: { 
    color: 'var(--text)', 
    textDecoration: 'none', 
    fontSize: '14px', 
    marginBottom: '16px', 
    display: 'inline-block', 
    fontWeight: '500',
    transition: 'color 0.2s'
  },
  card: { 
    background: 'var(--bg)', 
    padding: '24px', 
    borderRadius: '12px', 
    border: '1px solid var(--border)', 
    marginBottom: '20px' 
  },
  
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  avatar: { 
    width: '44px', height: '44px', borderRadius: '50%', 
    background: 'var(--accent)', color: '#fff', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    fontSize: '16px', fontWeight: 'bold', flexShrink: 0 
  },
  authorName: { color: 'var(--text-h)', textDecoration: 'none', fontWeight: '600', fontSize: '15px' },
  date: { color: 'var(--text)', fontSize: '12px', marginTop: '2px' },
  
  postText: { 
    fontSize: '16px', lineHeight: '1.6', 
    margin: '0 0 20px 0', 
    color: 'var(--text-h)', 
    whiteSpace: 'pre-wrap' 
  },
  image: { width: '100%', borderRadius: '8px', marginTop: '12px', border: '1px solid var(--border)' },
  stats: { 
    padding: '12px', 
    background: 'var(--social-bg)', 
    borderRadius: '8px', 
    fontSize: '13px', 
    color: 'var(--text)' 
  },
  
  commentsTitle: { margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-h)' },
  commentsCount: { color: 'var(--text)', fontWeight: '400', fontSize: '14px' },
  
  commentForm: { display: 'flex', gap: '10px', marginBottom: '24px', alignItems: 'center' },
  commentFormAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'var(--accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: 'bold', flexShrink: 0
  },
  input: { 
    flex: 1, 
    padding: '10px 16px', 
    borderRadius: '20px', 
    border: '1px solid var(--border)', 
    background: 'var(--social-bg)', 
    color: 'var(--text-h)', 
    outline: 'none', 
    fontSize: '14px' 
  },
  button: { 
    padding: '10px 20px', 
    background: 'var(--accent)', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '20px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '14px',
    transition: 'opacity 0.2s'
  },
  
  commentsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  emptyComments: { textAlign: 'center', color: 'var(--text)', fontSize: '14px', padding: '20px 0' },
  
  commentAvatar: { 
    width: '36px', height: '36px', borderRadius: '50%', 
    background: 'var(--accent)', color: '#fff', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    fontSize: '14px', fontWeight: 'bold', flexShrink: 0 
  },
  commentContent: { 
    flex: 1, 
    background: 'var(--social-bg)', 
    padding: '12px 16px', 
    borderRadius: '12px 12px 12px 4px',
    border: '1px solid var(--border)'
  },
  commentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  commentAuthorName: { color: 'var(--accent)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' },
  commentDate: { color: 'var(--text)', fontSize: '11px' },
  commentText: { margin: 0, fontSize: '14px', color: 'var(--text-h)', lineHeight: '1.4', wordBreak: 'break-word' }
};