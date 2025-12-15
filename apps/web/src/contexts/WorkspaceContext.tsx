'use client';

/**
 * Workspace Context for ProcessLab
 * 
 * Manages the current workspace context (organization or personal space).
 * Provides workspace info and switching capabilities.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '@/lib/api';

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



// Storage key for persisting selected workspace
const WORKSPACE_STORAGE_KEY = 'processlab_current_workspace';

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch organizations - DEPRECATED/SIMPLIFIED: Always empty for Private Space only
  const fetchOrganizations = useCallback(async () => {
    // No-op
  }, []);

  // Initialize workspace - always personal/private
  const initializeWorkspace = useCallback(() => {
    if (!user) {
      setCurrentWorkspaceState(null);
      return;
    }

    const personalWorkspace: Workspace = {
      type: 'personal',
      id: user.id,
      name: 'Private Space',
      slug: 'personal',
      role: 'owner',
    };
    setCurrentWorkspaceState(personalWorkspace);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(personalWorkspace));
  }, [user]);

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
    return '/spaces/private';
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

