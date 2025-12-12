'use client';

/**
 * Authentication Context for ProcessLab
 * 
 * Provides authentication state and functions throughout the app.
 * Handles JWT token storage, login, logout, and user info.
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const LOCAL_USER: User = {
  id: 'local-user',
  email: 'local@processlab',
  full_name: 'Local User',
  is_active: true,
  is_superuser: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize: Check for stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user info with stored token
      fetchUserInfo(storedToken);
    } else {
      setUser(LOCAL_USER);
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(LOCAL_USER);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(LOCAL_USER);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.error?.message || error.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.access_token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store token
      localStorage.setItem('auth_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      // Handle different error types
      if (error instanceof Error) {
        // AbortError means the request was aborted (timeout)
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please check your connection and try again.');
        }
        // TypeError is thrown for network errors (connection refused, CORS, etc.)
        // Different browsers have different messages: "Failed to fetch", "NetworkError", "Load failed"
        if (error instanceof TypeError) {
          throw new Error('Unable to connect to the server. Please verify the API is running at ' + API_URL);
        }
        // Re-throw with original message if it exists
        throw error;
      }
      throw new Error('An unexpected error occurred during login.');
    }
  };

  const register = async (
    email: string, 
    password: string, 
    fullName: string,
    orgName?: string
  ) => {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          organization_name: orgName || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const error = await response.json();
          errorMessage = error.error?.message || error.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.access_token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store token
      localStorage.setItem('auth_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      // Handle different error types
      if (error instanceof Error) {
        // AbortError means the request was aborted (timeout)
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please check your connection and try again.');
        }
        // TypeError is thrown for network errors (connection refused, CORS, etc.)
        // Different browsers have different messages: "Failed to fetch", "NetworkError", "Load failed"
        if (error instanceof TypeError) {
          throw new Error('Unable to connect to the server. Please verify the API is running at ' + API_URL);
        }
        // Re-throw with original message if it exists
        throw error;
      }
      throw new Error('An unexpected error occurred during registration.');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(LOCAL_USER);
    setLoading(false);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserInfo(token);
    } else {
      setUser(LOCAL_USER);
    }
  };

  const setAuth = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
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
