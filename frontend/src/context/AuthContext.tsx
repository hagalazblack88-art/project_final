import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';

// 🔥 ИЗМЕНЕНИЕ 1: Используем localhost, чтобы совпадало с адресом сайта в браузере
const API_URL = 'http://localhost:8000';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (newUserData: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Автоматическая проверка кук при загрузке страницы
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });

        if (response.ok) {
          const userData: User = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  // 2. Вход в аккаунт
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/auth/jwt/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const userResponse = await fetch(`${API_URL}/users/me`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (userResponse.ok) {
          const userData: User = await userResponse.json();
          setUser(userData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      return false;
    }
  };

  // 3. Регистрация пользователя
  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const generatedUsername = email.split('@')[0];

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          username: generatedUsername
        }),
        credentials: 'include', // 🔥 ИЗМЕНЕНИЕ 2: Добавили эту строку, чтобы браузер принял куку
      });

      if (response.ok) {
        return await login(email, password);
      }
      return false;
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      return false;
    }
  };

  // 4. Выход из аккаунта
  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/jwt/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      setUser(null);
    }
  };

  // 5. Обновление данных пользователя (для смены имени)
  const updateUser = (newUserData: User) => {
    setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};