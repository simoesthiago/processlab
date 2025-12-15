
import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSpaces } from '@/contexts/SpacesContext';

export interface Process {
    id: string;
    name: string;
    folder_id?: string | null;
    user_id?: string | null;
    current_version_id?: string;
    description?: string;
}

interface UseProcessOptions {
    processId?: string;
    workspaceId?: string;
}

export function useProcess({ processId, workspaceId }: UseProcessOptions) {
    const { token } = useAuth();
    const { getFolderPath } = useSpaces();

    const [process, setProcess] = useState<Process | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processName, setProcessName] = useState('New Process');
    const [folderPath, setFolderPath] = useState<Array<{ id: string; name: string }>>([]);

    const loadFolderPath = useCallback(async (folderId: string | null | undefined, fallbackName?: string) => {
        if (!folderId || !workspaceId) {
            setFolderPath([]);
            return;
        }

        try {
            const path = await getFolderPath(workspaceId, folderId);
            setFolderPath(path || []);
            if (fallbackName && (!path || path.length === 0)) {
                // If path not found but we have a name, maybe we should at least show that? 
            }
        } catch (err) {
            console.error('Failed to load folder path:', err);
            setFolderPath([]);
        }
    }, [workspaceId, getFolderPath]);

    const loadProcess = useCallback(async (id: string) => {
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            let data: Process;
            // Always fetch from spaces endpoint (private or otherwise)
            // But now we only have private space mostly.
            // If workspaceId is provided use it, otherwise assume 'private' or try generic get
            if (workspaceId) {
                data = await apiFetch(`/api/v1/spaces/${workspaceId}/processes/${id}`, { token });
            } else {
                // Fallback or legacy direct call if needed, but best to use spaces/private
                data = await apiFetch(`/api/v1/spaces/private/processes/${id}`, { token });
            }

            setProcess(data);
            setProcessName(data.name);

            await loadFolderPath(data.folder_id, data.name);

        } catch (err: any) {
            console.error('Load process error:', err);
            setError(err.message || 'Failed to load process');
        } finally {
            setLoading(false);
        }
    }, [token, workspaceId, loadFolderPath]);

    const createProcess = useCallback(async (name: string, description: string = '') => {
        if (!token) {
            throw new Error('Missing authentication');
        }

        const targetWorkspace = workspaceId || 'private';

        const created = await apiFetch(`/api/v1/spaces/${targetWorkspace}/processes`, {
            method: 'POST',
            token,
            body: JSON.stringify({ name, description, folder_id: null })
        });

        setProcess(created);
        setProcessName(created.name);
        return created;

    }, [token, workspaceId]);

    return {
        process,
        processName,
        folderPath,
        loading,
        error,
        loadProcess,
        createProcess,
        setProcessName
    };
}
