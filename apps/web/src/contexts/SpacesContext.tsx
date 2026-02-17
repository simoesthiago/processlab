'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '@/shared/services/api/client';


const DEFAULT_SPACE: Space = {
  id: 'private',
  name: 'Private Space',
  description: null,
  type: 'private',
  role: 'owner',
  is_protected: true,
};
const DEFAULT_TREE: SpaceTree = {
  space_id: 'private',
  root_folders: [],
  root_processes: [],
};
const PRIVATE_TREE_STORAGE_KEY = 'processlab-private-tree';

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
  created_at?: string | null;
}

export interface SpaceFolder {
  id: string;
  name: string;
  description?: string | null;
  parent_folder_id?: string | null;
  color?: string | null;
  icon?: string | null;
  children: SpaceFolder[];
  processes: SpaceProcess[];
  process_count?: number;
  created_at?: string | null;
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
  loadTree: (spaceId: string, forceRefresh?: boolean) => Promise<void>;
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
  const loadPrivateTreeFromStorage = useCallback((): SpaceTree | undefined => {
    if (typeof window === 'undefined') return undefined;
    try {
      const raw = window.localStorage.getItem(PRIVATE_TREE_STORAGE_KEY);
      if (!raw) return undefined;
      return JSON.parse(raw) as SpaceTree;
    } catch (err) {
      console.warn('Failed to read private tree from storage:', err);
      return undefined;
    }
  }, []);
  const persistPrivateTree = useCallback((tree: SpaceTree | undefined) => {
    if (typeof window === 'undefined' || !tree) return;
    try {
      window.localStorage.setItem(PRIVATE_TREE_STORAGE_KEY, JSON.stringify(tree));
    } catch (err) {
      console.warn('Failed to persist private tree:', err);
    }
  }, []);

  const authHeaders = useMemo<HeadersInit>(() => {
    if (!token) return {} as Record<string, string>;
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  // Keep ref in sync with trees state
  useEffect(() => {
    loadedTreesRef.current = new Set(Object.keys(trees));
  }, [trees]);

  const generateLocalId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }, []);

  const addFolderToState = useCallback(
    (spaceId: string, folder: SpaceFolder, parentFolderId: string | null) => {
      setTrees((prev: Record<string, SpaceTree>) => {
        const tree = prev[spaceId] ?? { ...DEFAULT_TREE, space_id: spaceId };
        let added = false;

        const attach = (folders: SpaceFolder[]): SpaceFolder[] => {
          return folders.map((f) => {
            let nextChildren = f.children ?? [];
            if (f.id === parentFolderId) {
              added = true;
              nextChildren = [...nextChildren, folder];
            } else if (nextChildren.length) {
              const updatedChildren = attach(nextChildren);
              if (updatedChildren !== nextChildren) {
                nextChildren = updatedChildren;
              }
            }

            if (nextChildren !== f.children) {
              return { ...f, children: nextChildren };
            }
            return f;
          });
        };

        let nextRootFolders = parentFolderId ? attach(tree.root_folders || []) : [...(tree.root_folders || []), folder];
        // If parent not found, fall back to root
        if (parentFolderId && !added) {
          nextRootFolders = [...nextRootFolders, folder];
        }

        return {
          ...prev,
          [spaceId]: {
            ...tree,
            root_folders: nextRootFolders,
            root_processes: tree.root_processes ?? [],
          },
        };
      });
    },
    []
  );

  const addProcessToState = useCallback(
    (spaceId: string, process: SpaceProcess, folderId: string | null) => {
      setTrees((prev: Record<string, SpaceTree>) => {
        const tree = prev[spaceId] ?? { ...DEFAULT_TREE, space_id: spaceId };
        if (!folderId) {
          return {
            ...prev,
            [spaceId]: {
              ...tree,
              root_processes: [...(tree.root_processes || []), process],
              root_folders: tree.root_folders || [],
            },
          };
        }

        let added = false;
        const attach = (folders: SpaceFolder[]): SpaceFolder[] => {
          return folders.map((f) => {
            let nextProcesses = f.processes ?? [];
            let nextChildren = f.children ?? [];

            if (f.id === folderId) {
              added = true;
              nextProcesses = [...nextProcesses, process];
            }

            if (nextChildren.length) {
              const updatedChildren = attach(nextChildren);
              if (updatedChildren !== nextChildren) {
                nextChildren = updatedChildren;
              }
            }

            if (nextProcesses !== f.processes || nextChildren !== f.children) {
              return { ...f, processes: nextProcesses, children: nextChildren };
            }
            return f;
          });
        };

        const nextRootFolders = attach(tree.root_folders || []);

        return {
          ...prev,
          [spaceId]: {
            ...tree,
            root_folders: nextRootFolders,
            root_processes: added ? tree.root_processes ?? [] : [...(tree.root_processes || []), process],
          },
        };
      });
    },
    []
  );

  const ensureDefaultSpace = useCallback(() => {
    setSpaces([DEFAULT_SPACE]);
    setSelectedSpaceId('private');
    setTrees((prev: Record<string, SpaceTree>) => {
      const storedTree = loadPrivateTreeFromStorage();
      if (prev['private']) return prev;
      return { ...prev, ['private']: storedTree ?? DEFAULT_TREE };
    });
    loadedTreesRef.current.add('private');
  }, [loadPrivateTreeFromStorage]);

  const refreshSpaces = useCallback(async () => {
    ensureDefaultSpace();
    // API no longer supports multiple spaces (orgs/teams), so we only use private space.
  }, [ensureDefaultSpace]);

  const loadTree = useCallback(
    async (spaceId: string, forceRefresh: boolean = false) => {
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
        if (!resp.ok) {
          throw new Error('Failed to load space tree');
        }
        const data = await resp.json();
        setTrees((prev: Record<string, SpaceTree>) => {
          // Only update if not already cached or forcing refresh
          if (!prev[spaceId] || forceRefresh) {
            loadedTreesRef.current.add(spaceId);
            if (spaceId === 'private') {
              persistPrivateTree(data);
            }
            return { ...prev, [spaceId]: data };
          }
          return prev;
        });
      } catch (err) {
        console.warn('Failed to load space tree, falling back to default if private:', err);
        if (spaceId === 'private') {
          setTrees((prev: Record<string, SpaceTree>) => {
            loadedTreesRef.current.add(spaceId);
            const storedTree = loadPrivateTreeFromStorage();
            const nextTree = storedTree ?? prev[spaceId] ?? DEFAULT_TREE;
            persistPrivateTree(nextTree);
            return { ...prev, [spaceId]: nextTree };
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [authHeaders, loadPrivateTreeFromStorage, persistPrivateTree]
  );

  const selectSpace = useCallback(
    (spaceId: string) => {
      setSelectedSpaceId(spaceId);
      // Check if tree needs to be loaded using functional update
      setTrees((prev: Record<string, SpaceTree>) => {
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
      const parentId = payload.parent_folder_id ?? null;

      // Always call API to create folder - even for private space
      // This ensures the folder is persisted in the database
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          parent_folder_id: parentId,
        }),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to create folder: ${errorText || resp.statusText}`);
      }
      const data: SpaceFolder = await resp.json();
      
      // Update local state after successful API creation
      if (spaceId === 'private') {
        addFolderToState(spaceId, data, parentId);
        // Also persist to localStorage for private space
        const nextTree = trees[spaceId] ?? { ...DEFAULT_TREE, space_id: spaceId };
        if (parentId) {
          // Add to parent folder's children
          const updateFolderChildren = (folders: SpaceFolder[]): SpaceFolder[] => {
            return folders.map(folder => {
              if (folder.id === parentId) {
                return { ...folder, children: [...(folder.children || []), data] };
              }
              if (folder.children?.length) {
                return { ...folder, children: updateFolderChildren(folder.children) };
              }
              return folder;
            });
          };
          nextTree.root_folders = updateFolderChildren(nextTree.root_folders || []);
        } else {
          // Add to root folders
          nextTree.root_folders = [...(nextTree.root_folders || []), data];
        }
        persistPrivateTree(nextTree);
      }
      
      await loadTree(spaceId);
      return data;
    },
    [addFolderToState, authHeaders, loadTree, trees, persistPrivateTree]
  );

  const createProcess = useCallback(
    async (spaceId: string, payload: { name: string; description?: string; folder_id?: string | null }) => {
      const folderId = payload.folder_id ?? null;

      // Always call API to create process - even for private space
      // This ensures the process is persisted in the database
      const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/processes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          folder_id: folderId,
        }),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to create process: ${errorText || resp.statusText}`);
      }
      const data: SpaceProcess = await resp.json();
      
      // Update local state after successful API creation
      if (spaceId === 'private') {
        addProcessToState(spaceId, data, folderId);
        // Also persist to localStorage for private space
        const nextTree = trees[spaceId] ?? { ...DEFAULT_TREE, space_id: spaceId };
        if (folderId) {
          // Add to folder's processes
          const updateFolderProcesses = (folders: SpaceFolder[]): SpaceFolder[] => {
            return folders.map(folder => {
              if (folder.id === folderId) {
                return { ...folder, processes: [...(folder.processes || []), data] };
              }
              if (folder.children?.length) {
                return { ...folder, children: updateFolderProcesses(folder.children) };
              }
              return folder;
            });
          };
          nextTree.root_folders = updateFolderProcesses(nextTree.root_folders || []);
        } else {
          // Add to root processes
          nextTree.root_processes = [...(nextTree.root_processes || []), data];
        }
        persistPrivateTree(nextTree);
      }
      
      await loadTree(spaceId);
      return data;
    },
    [addProcessToState, authHeaders, loadTree, trees, persistPrivateTree]
  );

  const deleteFolder = useCallback(
    async (spaceId: string, folderId: string) => {
      if (spaceId === 'private') {
        setTrees((prev: Record<string, SpaceTree>) => {
          const tree = prev[spaceId] ?? { ...DEFAULT_TREE, space_id: spaceId };

          const prune = (folders: SpaceFolder[]): { changed: boolean; next: SpaceFolder[] } => {
            let changed = false;
            const next = folders
              .map((f) => {
                if (f.id === folderId) {
                  changed = true;
                  return null;
                }
                if (f.children?.length) {
                  const res = prune(f.children);
                  if (res.changed) {
                    changed = true;
                    return { ...f, children: res.next };
                  }
                }
                return f;
              })
              .filter(Boolean) as SpaceFolder[];
            return { changed, next };
          };

          const res = prune(tree.root_folders || []);
          const nextTree: SpaceTree = {
            ...tree,
            root_folders: res.next,
            root_processes: tree.root_processes ?? [],
          };
          if (spaceId === 'private') {
            persistPrivateTree(nextTree);
          }
          return { ...prev, [spaceId]: nextTree };
        });
        return;
      }

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
    [authHeaders, loadTree]
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
      if (spaceId === 'private') {
        let updatedFolder: SpaceFolder | null = null;
        setTrees((prev: Record<string, SpaceTree>) => {
          const tree = prev[spaceId] ?? { ...DEFAULT_TREE, space_id: spaceId };

          const applyUpdate = (folders: SpaceFolder[]): SpaceFolder[] => {
            return folders.map((folder) => {
              let nextFolder = folder;
              if (folder.id === folderId) {
                nextFolder = {
                  ...folder,
                  name: payload.name ?? folder.name,
                  description: payload.description ?? folder.description,
                  parent_folder_id: payload.parent_folder_id ?? folder.parent_folder_id,
                  color: payload.color ?? folder.color,
                  icon: payload.icon ?? folder.icon,
                };
                updatedFolder = nextFolder;
              }
              const nextChildren = folder.children?.length ? applyUpdate(folder.children) : folder.children;
              if (nextChildren !== folder.children) {
                nextFolder = { ...nextFolder, children: nextChildren || [] };
              }
              return nextFolder;
            });
          };

          const nextTree = {
            ...tree,
            root_folders: applyUpdate(tree.root_folders || []),
            root_processes: tree.root_processes ?? [],
          };
          if (spaceId === 'private') {
            persistPrivateTree(nextTree);
          }
          return {
            ...prev,
            [spaceId]: nextTree,
          };
        });

        if (!updatedFolder) {
          // If not found, keep behavior consistent with previous implementation
          throw new Error('Folder not found locally');
        }
        return updatedFolder;
      }

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
    [authHeaders, loadTree, persistPrivateTree]
  );

  const getProcess = useCallback(
    async (spaceId: string, processId: string): Promise<SpaceProcess> => {
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
    [authHeaders]
  );

  const updateProcess = useCallback(
    async (
      spaceId: string,
      processId: string,
      payload: { name?: string; description?: string; folder_id?: string | null }
    ) => {
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
    [authHeaders, loadTree]
  );

  const deleteProcess = useCallback(
    async (spaceId: string, processId: string) => {
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
    [authHeaders, loadTree]
  );

  const moveFolder = useCallback(
    async (spaceId: string, folderId: string, parentFolderId: string | null) => {
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
    [authHeaders, loadTree]
  );

  const moveProcess = useCallback(
    async (spaceId: string, processId: string, folderId: string | null) => {
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
    [authHeaders, loadTree]
  );

  const getFolderPath = useCallback(
    async (spaceId: string, folderId: string): Promise<Array<{ id: string; name: string }>> => {
      const computeLocalPath = () => {
        // Try to derive the path from the cached tree (use default for private)
        const tree = trees[spaceId] ?? (spaceId === 'private' ? DEFAULT_TREE : undefined);
        if (!tree) return [];

        const findPath = (folders: SpaceFolder[]): Array<{ id: string; name: string }> | null => {
          for (const folder of folders) {
            if (folder.id === folderId) {
              // Garantir que sempre temos um name válido
              const folderName = folder.name || `Folder ${folder.id.slice(0, 8)}`;
              return [{ id: folder.id, name: folderName }];
            }
            const childPath = findPath(folder.children || []);
            if (childPath) {
              // Garantir que sempre temos um name válido
              const folderName = folder.name || `Folder ${folder.id.slice(0, 8)}`;
              return [{ id: folder.id, name: folderName }, ...childPath];
            }
          }
          return null;
        };

        return findPath(tree.root_folders || []) ?? [];
      };

      const localPath = computeLocalPath();
      console.log('[getFolderPath] Local path computed:', localPath, 'para folderId:', folderId, 'spaceId:', spaceId);
      // Expandir localPath para ver o conteúdo
      if (localPath && localPath.length > 0) {
        localPath.forEach((item, idx) => {
          console.log(`[getFolderPath] LocalPath item ${idx}:`, JSON.stringify(item, null, 2));
        });
        // Se temos path local, retornar imediatamente e fazer API em background
        console.log('[getFolderPath] Retornando path local imediatamente:', localPath);
        // Fazer chamada da API em background (não esperar) - usar void para evitar unhandled promise
        void (async () => {
          try {
            await fetch(`${API_URL}/api/v1/spaces/${spaceId}/folders/${folderId}/path`, {
              headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
              },
            });
          } catch {
            // Ignorar erros da API em background
          }
        })();
        return localPath;
      }

      // Se não temos path local, tentar API
      try {
        const url = `${API_URL}/api/v1/spaces/${spaceId}/folders/${folderId}/path`;
        const hasAuth = authHeaders && typeof authHeaders === 'object' && !Array.isArray(authHeaders) && 'Authorization' in authHeaders;
        console.log('[getFolderPath] Chamando API:', url, 'authHeaders keys:', Object.keys(authHeaders || {}), 'token presente:', hasAuth);
        
        // Adicionar timeout de 10 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const resp = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('[getFolderPath] Resposta recebida, status:', resp.status, 'ok:', resp.ok);
        if (!resp.ok) {
          const errorText = await resp.text();
          console.warn('[getFolderPath] Failed to load folder path from API, using local tree. Status:', resp.status, 'Error:', errorText);
          return localPath;
        }
        const data = await resp.json();
        console.log('[getFolderPath] Resposta da API (JSON):', JSON.stringify(data, null, 2));

        // A API sempre deve retornar pelo menos o folder atual no path
        // Se retornou um array vazio, há um problema na API
        if (Array.isArray(data.path)) {
          if (data.path.length > 0) {
            console.log('[getFolderPath] Retornando path da API (completo):', data.path);
            return data.path;
          } else {
            // API retornou path vazio - isso não deveria acontecer
            // Mas se temos folder_name, criar path mínimo
            console.warn('[getFolderPath] API retornou path vazio! Isso não deveria acontecer. Data:', data);
            if (data.folder_name) {
              console.log('[getFolderPath] Usando folder_name da API como fallback:', data.folder_name);
              return [{ id: data.folder_id ?? folderId, name: data.folder_name }];
            }
          }
        }

        // Se chegou aqui, a API não retornou path válido
        // Tentar usar localPath apenas se tiver dados
        if (localPath.length > 0) {
          console.warn('[getFolderPath] API não retornou path válido, usando localPath (pode estar incompleto):', localPath);
          return localPath;
        }

        // Último recurso: usar folder_name se disponível
        if (data.folder_name) {
          console.log('[getFolderPath] Usando folder_name como último recurso:', data.folder_name);
          return [{ id: data.folder_id ?? folderId, name: data.folder_name }];
        }

        console.error('[getFolderPath] Nenhum path disponível! Retornando array vazio. Data:', data, 'localPath:', localPath);
        return [];
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('[getFolderPath] Timeout ao carregar folder path da API (10s) - usando localPath');
        } else {
          console.error('[getFolderPath] Erro ao carregar folder path da API:', err, 'message:', err?.message);
        }
        
        // Se temos localPath, usar ele (mesmo que possa estar incompleto)
        if (localPath.length > 0) {
          console.log('[getFolderPath] Usando localPath devido ao erro/timeout:', localPath);
          return localPath;
        }
        
        // Se não temos localPath, retornar array vazio
        console.warn('[getFolderPath] Nenhum path disponível (localPath vazio)');
        return [];
      }
    },
    [authHeaders, trees]
  );

  const getSpaceStats = useCallback(
    async (spaceId: string): Promise<{ total_folders: number; total_processes: number; root_folders: number; root_processes: number }> => {
      const computeLocalStats = () => {
        const tree = trees[spaceId] ?? (spaceId === 'private' ? DEFAULT_TREE : undefined);
        if (!tree) {
          return { total_folders: 0, total_processes: 0, root_folders: 0, root_processes: 0 };
        }
        let totalFolders = 0;
        let totalProcesses = 0;

        const walk = (folders: SpaceFolder[]) => {
          folders.forEach((folder) => {
            totalFolders += 1;
            totalProcesses += folder.processes?.length ?? 0;
            if (folder.children?.length) {
              walk(folder.children);
            }
          });
        };

        walk(tree.root_folders || []);
        totalProcesses += tree.root_processes?.length ?? 0;

        return {
          total_folders: totalFolders,
          total_processes: totalProcesses,
          root_folders: tree.root_folders?.length ?? 0,
          root_processes: tree.root_processes?.length ?? 0,
        };
      };

      try {
        const resp = await fetch(`${API_URL}/api/v1/spaces/${spaceId}/stats`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        });
        if (!resp.ok) {
          return computeLocalStats();
        }
        const data = await resp.json();
        return data;
      } catch (err) {
        console.warn('Failed to load space stats, using local tree:', err);
        return computeLocalStats();
      }
    },
    [authHeaders, trees]
  );

  useEffect(() => {
    if (isAuthenticated) {
      refreshSpaces().catch((err: unknown) => console.error(err));
    } else {
      ensureDefaultSpace();
    }
  }, [isAuthenticated, refreshSpaces, ensureDefaultSpace]);

  // Persist private tree whenever it changes
  useEffect(() => {
    if (selectedSpaceId === 'private') {
      persistPrivateTree(trees['private']);
    }
  }, [selectedSpaceId, trees, persistPrivateTree]);

  const value: SpacesContextType = {
    spaces,
    selectedSpaceId,
    trees,
    loading,
    selectSpace,
    refreshSpaces,
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

