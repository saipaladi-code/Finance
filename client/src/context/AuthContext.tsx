import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, BusinessSetting } from '../types/index.js';
import { api, getAuthToken, setAuthToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  businessSettings: BusinessSetting | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSetting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        return;
      }
      const data = await api.getMe();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        setAuthToken(null);
      }
    } catch {
      setUser(null);
      setAuthToken(null);
    }
  };

  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      if (data.success && data.settings) {
        setBusinessSettings(data.settings);
      }
    } catch (err) {
      console.warn('Could not load business settings', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([refreshUser(), refreshSettings()]);
      setLoading(false);
    };
    init();
  }, []);

  const login = (token: string, userData: User) => {
    setAuthToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout API error', err);
    }
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        businessSettings,
        login,
        logout,
        refreshUser,
        refreshSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
