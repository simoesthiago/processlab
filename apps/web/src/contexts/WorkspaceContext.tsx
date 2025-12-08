'use client';

/**
 * Workspace Context for ProcessLab
 * 
 * Manages the current workspace context (organization or personal space).
 * Provides workspace info and switching capabilities.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type WorkspaceType = 'organization' | 'personal';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  role: 'viewer' | 'editor' | 'admin';
  settings?: Record<string, unknown>;
}

export interface Workspace {
  type: WorkspaceType;
  id: string;
  name: string;
  slug: string;
  role: 'viewer' | 'editor' | 'admin' | 'owner';
}

interface WorkspaceContextType {
  // Current workspace
  currentWorkspace: Workspace | null;
  
  // Available workspaces
  organizations: Organization[];
  
  // Loading state
  loading: boolean;
  
  // Actions
  setCurrentWorkspace: (workspace: Workspace) => void;
  refreshOrganizations: () => Promise<void>;
  
  // Helpers
  getWorkspaceBasePath: () => string;
  canEdit: () => boolean;
  canAdmin: () => boolean;
  isPersonalWorkspace: () => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Storage key for persisting selected workspace
const WORKSPACE_STORAGE_KEY = 'processlab_current_workspace';

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch organizations the user belongs to
  const fetchOrganizations = useCallback(async () => {
    if (!token) {
      setOrganizations([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/organizations/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  }, [token]);

  // Initialize workspace from storage or default
  const initializeWorkspace = useCallback(() => {
    if (!user) {
      setCurrentWorkspaceState(null);
      return;
    }

    // Try to restore from localStorage
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validate the stored workspace is still accessible
        if (parsed.type === 'personal' || 
            organizations.some(org => org.id === parsed.id)) {
          setCurrentWorkspaceState(parsed);
          return;
        }
      } catch (e) {
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    }

    // Default to user's primary organization or personal workspace
    if (user.organization_id && organizations.length > 0) {
      const primaryOrg = organizations.find(org => org.id === user.organization_id);
      if (primaryOrg) {
        const workspace: Workspace = {
          type: 'organization',
          id: primaryOrg.id,
          name: primaryOrg.name,
          slug: primaryOrg.slug,
          role: primaryOrg.role,
        };
        setCurrentWorkspaceState(workspace);
        localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
        return;
      }
    }

    // Fallback to personal workspace
    const personalWorkspace: Workspace = {
      type: 'personal',
      id: user.id,
      name: 'Personal',
      slug: 'personal',
      role: 'owner',
    };
    setCurrentWorkspaceState(personalWorkspace);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(personalWorkspace));
  }, [user, organizations]);

  // Load organizations when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchOrganizations().finally(() => setLoading(false));
    } else {
      setOrganizations([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
    }
  }, [isAuthenticated, fetchOrganizations]);

  // Initialize workspace after organizations are loaded
  useEffect(() => {
    if (!loading && isAuthenticated) {
      initializeWorkspace();
    }
  }, [loading, isAuthenticated, organizations, initializeWorkspace]);

  // Set current workspace and persist
  const setCurrentWorkspace = useCallback((workspace: Workspace) => {
    setCurrentWorkspaceState(workspace);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
  }, []);

  // Refresh organizations
  const refreshOrganizations = useCallback(async () => {
    await fetchOrganizations();
  }, [fetchOrganizations]);

  // Get base path for current workspace
  const getWorkspaceBasePath = useCallback(() => {
    if (!currentWorkspace) return '/';
    if (currentWorkspace.type === 'personal') {
      return '/home';
    }
    return '/dashboard';
  }, [currentWorkspace]);

  // Check if user can edit in current workspace
  const canEdit = useCallback(() => {
    if (!currentWorkspace) return false;
    return ['editor', 'admin', 'owner'].includes(currentWorkspace.role);
  }, [currentWorkspace]);

  // Check if user can admin in current workspace
  const canAdmin = useCallback(() => {
    if (!currentWorkspace) return false;
    return ['admin', 'owner'].includes(currentWorkspace.role);
  }, [currentWorkspace]);

  // Check if current workspace is personal
  const isPersonalWorkspace = useCallback(() => {
    return currentWorkspace?.type === 'personal';
  }, [currentWorkspace]);

  const value: WorkspaceContextType = {
    currentWorkspace,
    organizations,
    loading,
    setCurrentWorkspace,
    refreshOrganizations,
    getWorkspaceBasePath,
    canEdit,
    canAdmin,
    isPersonalWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

