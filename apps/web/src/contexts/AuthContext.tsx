'use client';

/**
 * Authentication Context for ProcessLab
 * 
 * Simplified for local-first single-user mode.
 * Always returns a fixed local user.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  organization_id?: string;
  role?: string;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, orgName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setAuth: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


// Fixed local user
const LOCAL_USER: User = {
  id: 'local-user',
  email: 'local@processlab',
  full_name: 'Local User',
  is_active: true,
  is_superuser: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>('local-token');
  const [loading, setLoading] = useState(true);

  // Initialize: Always auto-login as local user
  useEffect(() => {
    setUser(LOCAL_USER);
    setLoading(false);
  }, []);

  // Check backend health periodically or on mount, but user is always local
  // No explicit fetch needed for auth in single-user mode

  // No-op functions for local mode
  const login = async (email: string, password: string) => {
    console.log("Login ignored in local mode");
    setUser(LOCAL_USER);
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    orgName?: string
  ) => {
    console.log("Register ignored in local mode");
    setUser(LOCAL_USER);
  };

  const logout = () => {
    console.log("Logout ignored in local mode");
    // Don't actually clear user, just re-set to local
    setUser(LOCAL_USER);
  };

  const refreshUser = async () => {
    setUser(LOCAL_USER);
  };

  const setAuth = (newToken: string, newUser: User) => {
    setUser(newUser);
  };

  const value: AuthContextType = {
    user,
    token, // Return a dummy token for current API compatibility
    loading,
    isAuthenticated: true, // Always authenticated
    login,
    register,
    logout,
    refreshUser,
    setAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
