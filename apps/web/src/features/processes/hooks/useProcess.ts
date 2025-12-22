/**
 * useProcess Hook
 * 
 * Simplified hook that uses the process service.
 */

import { useState, useCallback, useEffect } from 'react';
import { processService, Process } from '@/shared/services/api';

interface UseProcessOptions {
    processId?: string;
    workspaceId?: string;
}

export function useProcess({ processId }: UseProcessOptions) {
    const [process, setProcess] = useState<Process | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processName, setProcessName] = useState('New Process');

    const loadProcess = useCallback(async (id: string) => {
        if (!id) {
            console.warn('[useProcess] Process ID não fornecido');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await processService.findById(id);
            setProcess(data);
            setProcessName(data.name);
            setError(null);
        } catch (err: any) {
            console.error('[useProcess] Load process error:', err);
            
            let errorMessage = 'Failed to load process';
            if (err.status === 0 || err.data?.networkError) {
                errorMessage = 'Cannot connect to API server. Please ensure the server is running.';
            } else if (err.status === 404) {
                errorMessage = 'Process not found. It may have been deleted.';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (processId) {
            loadProcess(processId);
        }
    }, [processId, loadProcess]);

    const createProcess = useCallback(async (name: string, description: string = '') => {
        const created = await processService.create({ name, description, folder_id: null });
        setProcess(created);
        setProcessName(created.name);
        return created;
    }, []);

    return {
        process,
        processName,
        loading,
        error,
        loadProcess,
        createProcess,
        setProcessName
    };
}

