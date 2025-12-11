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
  process_count?: number;
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
  createSpace: (payload: { name: string; description?: string }) => Promise<Space>;
  loadTree: (spaceId: string) => Promise<void>;
  refreshTree: (spaceId: string) => Promise<void>;
  createFolder: (spaceId: string, payload: { name: string; description?: string; parent_folder_id?: string | null }) => Promise<SpaceFolder>;
  updateFolder: (spaceId: string, folderId: string, payload: { name?: string; description?: string; parent_folder_id?: string | null; color?: string; icon?: string }) => Promise<SpaceFolder>;
  moveFolder: (spaceId: string, folderId: string, parentFolderId: string | null) => Promise<SpaceFolder>;
  createProcess: (spaceId: string, payload: { name: string; description?: string; folder_id?: string | null }) => Promise<SpaceProcess>;
  updateProcess: (spaceId: string, processId: string, payload: { name?: string; description?: string; folder_id?: string | null }) => Promise<SpaceProcess>;
  moveProcess: (spaceId: string, processId: string, folderId: string | null) => Promise<SpaceProcess>;
  deleteFolder: (spaceId: string, folderId: string) => Promise<void>;
  deleteProcess: (spaceId: string, processId: string) => Promise<void>;
  getFolder: (spaceId: string, folderId: string) => SpaceFolder | null;
  getProcess: (spaceId: string, processId: string) => Promise<SpaceProcess>;
  getFolderPath: (spaceId: string, folderId: string) => Promise<Array<{ id: string; name: string }>>;
  getSpaceStats: (spaceId: string) => Promise<{ total_folders: number; total_processes: number; root_folders: number; root_processes: number }>;
}

const SpacesContext = createContext<SpacesContextType | undefined>(undefined);

export function SpacesProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [trees, setTrees] = useState<Record<string, SpaceTree>>({});
  const [loading, setLoading] = useState(false);
  const loadedTreesRef = React.useRef<Set<string>>(new Set());

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  // Keep ref in sync with trees state
  useEffect(() => {
    loadedTreesRef.current = new Set(Object.keys(trees));
  }, [trees]);

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

  const createSpace = useCallback(
    async (payload: { name: string; description?: string }): Promise<Space> => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to create space: ${errorText}`);
      }
      const data = await resp.json();
      await refreshSpaces();
      return data;
    },
    [authHeaders, refreshSpaces, token]
  );

  const loadTree = useCallback(
    async (spaceId: string, forceRefresh: boolean = false) => {
      if (!token) return;
      
      // Check cache using ref to avoid dependency on trees state
      if (!forceRefresh && loadedTreesRef.current.has(spaceId)) {
        return; // Already loaded (ref is kept in sync with state via useEffect)
      }
      
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
        setTrees((prev) => {
          // Only update if not already cached or forcing refresh
          if (!prev[spaceId] || forceRefresh) {
            loadedTreesRef.current.add(spaceId);
            return { ...prev, [spaceId]: data };
          }
          return prev;
        });
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, token]
  );

  const selectSpace = useCallback(
    (spaceId: string) => {
      setSelectedSpaceId(spaceId);
      // Check if tree needs to be loaded using functional update
      setTrees((prev) => {
        if (!prev[spaceId]) {
          // Load tree asynchronously
          loadTree(spaceId).catch(console.error);
      }
        return prev;
      });
    },
    [loadTree]
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
      const data: SpaceFolder = await resp.json();
      await loadTree(spaceId);
      return data;
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
      const data: SpaceProcess = await resp.json();
      await loadTree(spaceId);
      return data;
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

  const refreshTree = useCallback(
    async (spaceId: string) => {
      await loadTree(spaceId, true); // Force refresh
    },
    [loadTree]
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

  const updateFolder = useCallback(
    async (
      spaceId: string,
      folderId: string,
      payload: { name?: string; description?: string; parent_folder_id?: string | null; color?: string; icon?: string }
    ) => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/folders/${folderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to update folder: ${errorText}`);
      }
      const data: SpaceFolder = await resp.json();
      await loadTree(spaceId);
      return data;
    },
    [authHeaders, loadTree, token]
  );

  const getProcess = useCallback(
    async (spaceId: string, processId: string): Promise<SpaceProcess> => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/processes/${processId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!resp.ok) {
        throw new Error('Failed to load process');
      }
      const data: SpaceProcess = await resp.json();
      return data;
    },
    [authHeaders, token]
  );

  const updateProcess = useCallback(
    async (
      spaceId: string,
      processId: string,
      payload: { name?: string; description?: string; folder_id?: string | null }
    ) => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/processes/${processId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to update process: ${errorText}`);
      }
      const data: SpaceProcess = await resp.json();
      await loadTree(spaceId);
      return data;
    },
    [authHeaders, loadTree, token]
  );

  const deleteProcess = useCallback(
    async (spaceId: string, processId: string) => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/processes/${processId}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders,
        },
      });
      if (!resp.ok) {
        throw new Error('Failed to delete process');
      }
      await loadTree(spaceId);
    },
    [authHeaders, loadTree, token]
  );

  const moveFolder = useCallback(
    async (spaceId: string, folderId: string, parentFolderId: string | null) => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/folders/${folderId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ parent_folder_id: parentFolderId }),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to move folder: ${errorText}`);
      }
      const data: SpaceFolder = await resp.json();
      await loadTree(spaceId);
      return data;
    },
    [authHeaders, loadTree, token]
  );

  const moveProcess = useCallback(
    async (spaceId: string, processId: string, folderId: string | null) => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/processes/${processId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ folder_id: folderId }),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to move process: ${errorText}`);
      }
      const data: SpaceProcess = await resp.json();
      await loadTree(spaceId);
      return data;
    },
    [authHeaders, loadTree, token]
  );

  const getFolderPath = useCallback(
    async (spaceId: string, folderId: string): Promise<Array<{ id: string; name: string }>> => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/folders/${folderId}/path`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!resp.ok) {
        throw new Error('Failed to load folder path');
      }
      const data = await resp.json();
      return data.path || [];
    },
    [authHeaders, token]
  );

  const getSpaceStats = useCallback(
    async (spaceId: string): Promise<{ total_folders: number; total_processes: number; root_folders: number; root_processes: number }> => {
      if (!token) throw new Error('Not authenticated');
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/stats`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!resp.ok) {
        throw new Error('Failed to load space stats');
      }
      const data = await resp.json();
      return data;
    },
    [authHeaders, token]
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
    createSpace,
    loadTree,
    refreshTree,
    createFolder,
    updateFolder,
    moveFolder,
    createProcess,
    updateProcess,
    moveProcess,
    deleteFolder,
    deleteProcess,
    getFolder,
    getProcess,
    getFolderPath,
    getSpaceStats,
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

