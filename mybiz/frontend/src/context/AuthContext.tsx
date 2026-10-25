import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../api';
import { User, Business } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  businesses: Business[];
  activeBusiness: Business | null;
  setActiveBusiness: (b: Business | null) => void;
  unreadCount: number;
  setUnreadCount: (c: number) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  refreshBusinesses: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUserData = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
      const bizList = await api.getBusinesses();
      setBusinesses(bizList);
      if (bizList.length > 0 && !activeBusiness) {
        setActiveBusiness(bizList[0]);
      }
      const notifs = await api.getNotifications();
      setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
    } catch {
      setUser(null);
      removeAuthToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getAuthToken()) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.access_token);
    setUser(res.user);
    await fetchUserData();
  };

  const register = async (email: string, password: string, full_name: string) => {
    const res = await api.register({ email, password, full_name });
    setAuthToken(res.access_token);
    setUser(res.user);
    await fetchUserData();
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setBusinesses([]);
    setActiveBusiness(null);
  };

  const refreshBusinesses = async () => {
    try {
      const bizList = await api.getBusinesses();
      setBusinesses(bizList);
      if (bizList.length > 0 && (!activeBusiness || !bizList.find((b: any) => b.id === activeBusiness.id))) {
        setActiveBusiness(bizList[0]);
      }
    } catch {}
  };

  const refreshNotifications = async () => {
    try {
      const notifs = await api.getNotifications();
      setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        businesses,
        activeBusiness,
        setActiveBusiness,
        unreadCount,
        setUnreadCount,
        login,
        register,
        logout,
        refreshBusinesses,
        refreshNotifications
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
