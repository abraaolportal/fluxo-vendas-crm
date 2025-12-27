
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { AuthService } from '../services/mockBackend';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isManager: boolean;
  isFullAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for persisted session
  useEffect(() => {
    const persisted = localStorage.getItem('fluxo_session');
    if (persisted) {
      const parsedUser = JSON.parse(persisted);
      setUser(parsedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const userData = await AuthService.login(email, pass);
      setUser(userData);
      localStorage.setItem('fluxo_session', JSON.stringify(userData));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fluxo_session');
  };

  const isManager = user?.role === 'ADMIN' || user?.role === 'COORDINATOR' || user?.role === 'SUPERVISOR';
  const isFullAdmin = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isManager, isFullAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
