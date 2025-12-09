'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type SpaceType = 'private' | 'team';

export interface Space {
  id: string;
  name: string;
  description?: string | null;
  type: SpaceType;
  role: 'admin' | 'editor' | 'viewer' | 'owner';
  is_protected: boolean;
}

export interface SpaceProcess {
  id: string;
  name: string;
  description?: string | null;
  folder_id?: string | null;
}

export interface SpaceFolder {
  id: string;
  name: string;
  description?: string | null;
  parent_folder_id?: string | null;
  children: SpaceFolder[];
  processes: SpaceProcess[];
}

export interface SpaceTree {
  space_id: string;
  root_folders: SpaceFolder[];
  root_processes: SpaceProcess[];
}

interface SpacesContextType {
  spaces: Space[];
  selectedSpaceId: string | null;
  trees: Record<string, SpaceTree | undefined>;
  loading: boolean;
  selectSpace: (spaceId: string) => void;
  refreshSpaces: () => Promise<void>;
  loadTree: (spaceId: string) => Promise<void>;
  createFolder: (spaceId: string, payload: { name: string; description?: string; parent_folder_id?: string | null }) => Promise<void>;
  createProcess: (spaceId: string, payload: { name: string; description?: string; folder_id?: string | null }) => Promise<void>;
  deleteFolder: (spaceId: string, folderId: string) => Promise<void>;
  getFolder: (spaceId: string, folderId: string) => SpaceFolder | null;
}

const SpacesContext = createContext<SpacesContextType | undefined>(undefined);

export function SpacesProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [trees, setTrees] = useState<Record<string, SpaceTree>>({});
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const refreshSpaces = useCallback(async () => {
    if (!token) {
      setSpaces([]);
      return;
    }
    const resp = await fetch(`${API_URL}/api/v1/spaces`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });
    if (!resp.ok) throw new Error('Failed to load spaces');
    const data = await resp.json();
    setSpaces(data.spaces || []);
    if (!selectedSpaceId && data.spaces?.length) {
      // Prefer private space if present
      const preferred = data.spaces.find((s: Space) => s.id === 'private') || data.spaces[0];
      setSelectedSpaceId(preferred.id);
    }
  }, [authHeaders, selectedSpaceId, token]);

  const loadTree = useCallback(
    async (spaceId: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/tree`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        });
        if (!resp.ok) throw new Error('Failed to load space tree');
        const data = await resp.json();
        setTrees((prev) => ({ ...prev, [spaceId]: data }));
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, token]
  );

  const selectSpace = useCallback(
    (spaceId: string) => {
      setSelectedSpaceId(spaceId);
      if (!trees[spaceId]) {
        loadTree(spaceId);
      }
    },
    [loadTree, trees]
  );

  const createFolder = useCallback(
    async (spaceId: string, payload: { name: string; description?: string; parent_folder_id?: string | null }) => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          parent_folder_id: payload.parent_folder_id ?? null,
        }),
      });
      if (!resp.ok) {
        throw new Error('Failed to create folder');
      }
      await loadTree(spaceId);
    },
    [authHeaders, loadTree, token]
  );

  const createProcess = useCallback(
    async (spaceId: string, payload: { name: string; description?: string; folder_id?: string | null }) => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/processes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          folder_id: payload.folder_id ?? null,
        }),
      });
      if (!resp.ok) {
        throw new Error('Failed to create process');
      }
      await loadTree(spaceId);
    },
    [authHeaders, loadTree, token]
  );

  const deleteFolder = useCallback(
    async (spaceId: string, folderId: string) => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/folders/${folderId}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders,
        },
      });
      if (!resp.ok) {
        throw new Error('Failed to delete folder');
      }
      await loadTree(spaceId);
    },
    [authHeaders, loadTree, token]
  );

  const getFolder = useCallback(
    (spaceId: string, folderId: string): SpaceFolder | null => {
      const tree = trees[spaceId];
      if (!tree) return null;
      const stack = [...tree.root_folders];
      while (stack.length) {
        const current = stack.pop()!;
        if (current.id === folderId) return current;
        if (current.children?.length) stack.push(...current.children);
      }
      return null;
    },
    [trees]
  );

  useEffect(() => {
    if (isAuthenticated) {
      refreshSpaces().catch((err) => console.error(err));
    } else {
      setSpaces([]);
      setSelectedSpaceId(null);
      setTrees({});
    }
  }, [isAuthenticated, refreshSpaces]);

  const value: SpacesContextType = {
    spaces,
    selectedSpaceId,
    trees,
    loading,
    selectSpace,
    refreshSpaces,
    loadTree,
    createFolder,
    createProcess,
    deleteFolder,
    getFolder,
  };

  return <SpacesContext.Provider value={value}>{children}</SpacesContext.Provider>;
}

export function useSpaces() {
  const ctx = useContext(SpacesContext);
  if (!ctx) {
    throw new Error('useSpaces must be used within a SpacesProvider');
  }
  return ctx;
}

