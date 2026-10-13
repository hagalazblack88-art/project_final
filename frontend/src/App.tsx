import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Страницы
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import PostDetailPage from './pages/PostDetailPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import LoginPage from './pages/LoginPage'; // 🔥 Подключаем твой существующий файл

// Компонент защиты маршрутов
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text)' }}>Загрузка...</div>;
  }
  
  // 🔥 Если пользователь не авторизован, перенаправляем его на /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 🔥 Страница входа ДОСТУПНА ВСЕМ (без защиты) */}
          <Route path="/login" element={<LoginPage />} />
          {/* Если у тебя есть RegisterPage, добавь её сюда же: <Route path="/register" element={<RegisterPage />} /> */}
          
          {/* 🔥 Все остальные страницы ЗАЩИЩЕНЫ и используют Layout с сайдбаром */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/posts/:postId" element={<PostDetailPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:slug" element={<GroupDetailPage />} />
          </Route>
          
          {/* Редирект всех неизвестных маршрутов на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;