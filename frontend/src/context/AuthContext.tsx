import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('al_token'));
  const [isLoading, setIsLoading] = useState(true);
  const { error: toastError, info: toastInfo } = useToast();

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('al_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
        localStorage.removeItem('al_token');
      }
    } catch (err: any) {
      console.warn('Authentication check failed:', err.message);
      setUser(null);
      localStorage.removeItem('al_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    // Listen for session expiration events dispatched by API service
    const handleSessionExpired = (e: any) => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('al_token');
      toastError(e.detail?.message || 'Your session has expired. Please log in again.');
    };

    window.addEventListener('al:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('al:session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.auth.login({ username, password });
    if (res.success && res.token) {
      localStorage.setItem('al_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('al_token');
      setToken(null);
      setUser(null);
      toastInfo('You have logged out.');
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

