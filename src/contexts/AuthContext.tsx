import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/authService';
import { subscribeToPushNotifications, isPushNotificationSupported } from '../utils/pushNotifications';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && authService.isAuthenticated()) {
      setUser(JSON.parse(savedUser));
      setupPushNotifications();
    }
    setIsLoading(false);
  }, []);

  const setupPushNotifications = async () => {
    const isSupported = await isPushNotificationSupported();
    if (!isSupported) {
      console.log('Push notifications not supported in this browser');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      await subscribeToPushNotifications(token);
    } catch (error) {
      console.error('Failed to setup push notifications:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      await setupPushNotifications();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, organizationName: string) => {
    try {
      const response = await authService.register({ email, password, name, organizationName });
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      await setupPushNotifications();
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
