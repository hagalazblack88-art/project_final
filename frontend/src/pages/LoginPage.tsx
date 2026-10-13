import { useState } from 'react';
import type { SubmitEventHandler } from 'react'; 
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true); // Переключатель режимов
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => { 
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      if (isLoginMode) {
        // РЕЖИМ ВХОДА
        const success = await login(email, password); 
        
        // 🔥 КРИТИЧЕСКИ ВАЖНО: перенаправляем на главную после успешного входа
        if (success) {
          window.location.href = '/'; 
        } else {
          setError('Неверный email или пароль');
        }
      } else {
        // РЕЖИМ РЕГИСТРАЦИИ
        const success = await register(email, password);
        if (success) {
          setSuccessMessage('🎉 Регистрация успешна! Теперь вы можете войти.');
          setIsLoginMode(true); // Автоматически переключаем на форму входа
          setPassword(''); // Сбрасываем пароль для безопасности
        } else {
          setError('Ошибка регистрации. Возможно, такой email уже занят или пароль слишком простой.');
        }
      }
    } catch (err) {
      setError('Ошибка соединения с сервером бэкенда');
    }
  };

  return (
    <div style={styles.authContainer}>
      <form onSubmit={handleSubmit} style={styles.authForm}>
        <h2>{isLoginMode ? 'Вход в соцсеть' : 'Регистрация'}</h2>
        
        {error && <p style={styles.error}>{error}</p>}
        {successMessage && <p style={styles.success}>{successMessage}</p>}
        
        <input 
          type="email" 
          placeholder="Электронная почта" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />
        
        <button type="submit" style={styles.button}>
          {isLoginMode ? 'Войти' : 'Зарегистрироваться'}
        </button>

        <p style={styles.toggleText}>
          {isLoginMode ? 'Еще нет аккаунта?' : 'Уже есть аккаунт?'} {' '}
          <span 
            style={styles.toggleLink} 
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
              setSuccessMessage('');
            }}
          >
            {isLoginMode ? 'Зарегистрироваться' : 'Войти'}
          </span>
        </p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  authContainer: { 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh', 
    background: 'var(--social-bg)', 
    fontFamily: 'var(--sans)',
    color: 'var(--text-h)'
  },
  authForm: { 
    background: 'var(--bg)', 
    padding: '40px', 
    borderRadius: '12px', 
    boxShadow: 'var(--shadow)', 
    display: 'flex', 
    flexDirection: 'column', 
    width: '100%',
    maxWidth: '400px',
    border: '1px solid var(--border)' 
  },
  input: { 
    padding: '12px', 
    marginBottom: '16px', 
    borderRadius: '8px', 
    border: '1px solid var(--border)', 
    fontSize: '15px',
    background: 'var(--bg)', 
    color: 'var(--text-h)', 
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  button: { 
    padding: '12px', 
    background: 'var(--accent)', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '16px',
    transition: 'opacity 0.2s',
    marginTop: '8px'
  },
  error: { 
    color: '#ef4444', 
    fontSize: '14px', 
    marginBottom: '16px', 
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    padding: '12px', 
    borderRadius: '8px', 
    border: '1px solid rgba(239, 68, 68, 0.3)',
    textAlign: 'center',
    margin: 0
  },
  success: { 
    color: '#22c55e', 
    fontSize: '14px', 
    marginBottom: '16px', 
    backgroundColor: 'rgba(34, 197, 94, 0.1)', 
    padding: '12px', 
    borderRadius: '8px', 
    border: '1px solid rgba(34, 197, 94, 0.3)',
    textAlign: 'center',
    margin: 0
  },
  toggleText: { 
    fontSize: '14px', 
    textAlign: 'center', 
    marginTop: '20px', 
    color: 'var(--text)' 
  },
  toggleLink: { 
    color: 'var(--accent)', 
    cursor: 'pointer', 
    fontWeight: '600', 
    textDecoration: 'underline' 
  }
};