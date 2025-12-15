'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';



export interface RecentItem {
  id: string;
  type: 'process' | 'folder';
  name: string;
  space_type: 'private' | 'team';
  space_id?: string | null;
  parent_folder_id?: string | null;
  updated_at?: string;
}

interface UseRecentItemsOptions {
  autoFetch?: boolean;
}

export function useRecentItems(limit = 12, options: UseRecentItemsOptions = {}) {
  const { token } = useAuth();
  const { autoFetch = true } = options;
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const normalize = useCallback(
    (items: RecentItem[]): RecentItem[] =>
      items.map((item) => ({
        ...item,
        space_id: item.space_type === 'private' ? 'private' : item.space_id ?? null,
        updated_at: item.updated_at || new Date().toISOString(),
      })),
    []
  );

  const refreshRecents = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const resp = await fetch(`${API_URL}/api/v1/users/me/recents?limit=${limit}`, {
        headers,
      });
      if (!resp.ok) throw new Error('Failed to load recents');
      const data = await resp.json();
      setRecents(normalize(data.items || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [limit, normalize, token]);

  const addRecentOptimistic = useCallback(
    (item: Omit<RecentItem, 'updated_at'> & { updated_at?: string }) => {
      const [normalized] = normalize([
        { ...item, updated_at: item.updated_at || new Date().toISOString() },
      ]);
      setRecents((prev) => {
        const filtered = prev.filter(
          (existing) =>
            !(
              existing.id === normalized.id &&
              existing.space_id === normalized.space_id &&
              existing.type === normalized.type
            )
        );
        return [normalized, ...filtered].slice(0, limit);
      });
    },
    [limit, normalize]
  );

  useEffect(() => {
    if (autoFetch) {
      refreshRecents().catch((err) => console.error(err));
    }
  }, [autoFetch, refreshRecents]);

  return { recents, loading, refreshRecents, addRecentOptimistic };
}

