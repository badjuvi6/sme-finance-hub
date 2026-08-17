import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/authApi';

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'sfh_token';
const STORAGE_USER_KEY = 'sfh_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const bootstrapSession = async () => {
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);
      const cachedUser = localStorage.getItem(STORAGE_USER_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // ignore malformed cache
        }
      }

      try {
        const { data } = await authApi.getMe();
        setUser(data.user);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      } catch {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapSession();
  }, []);

  const persistSession = (data) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => {
    setAuthError('');
    try {
      const { data } = await authApi.login(email, password);
      persistSession(data);
      return data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to sign in. Please try again.';
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setAuthError('');
    try {
      const { data } = await authApi.register(payload);
      persistSession(data);
      return data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to create your account. Please try again.';
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    loading,
    authError,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
