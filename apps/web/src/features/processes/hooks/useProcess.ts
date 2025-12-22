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

        // Prevent loading the same process if already loaded
        if (process?.id === id && !error) {
            console.log('[useProcess] Process já carregado, pulando:', id);
            return;
        }

        console.log('[useProcess] loadProcess iniciado para id:', id);
        setLoading(true);
        setError(null);

        try {
            console.log('[useProcess] Chamando processService.findById para id:', id);
            const data = await processService.findById(id);
            console.log('[useProcess] Process carregado com sucesso:', { id: data.id, name: data.name, folder_id: data.folder_id, data });
            setProcess(data);
            setProcessName(data.name);
            setError(null);
        } catch (err: any) {
            console.error('[useProcess] Load process error:', err);
            console.error('[useProcess] Error details:', { 
                message: err.message, 
                status: err.status, 
                data: err.data,
                stack: err.stack 
            });
            
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
            console.log('[useProcess] loadProcess finalizado para id:', id);
            setLoading(false);
        }
    }, [process, error]);

    useEffect(() => {
        console.log('[useProcess] useEffect chamado com processId:', processId);
        if (processId) {
            // Only load if we don't already have this process loaded
            if (!process || process.id !== processId) {
                console.log('[useProcess] Chamando loadProcess para processId:', processId);
                loadProcess(processId);
            }
        } else {
            console.log('[useProcess] processId não fornecido, limpando processo');
            setProcess(null);
        }
    }, [processId, loadProcess, process]);

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

