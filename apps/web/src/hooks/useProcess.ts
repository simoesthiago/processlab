
import { useState, useCallback, useEffect } from 'react';
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
    const { token, loading: authLoading } = useAuth();

    const [process, setProcess] = useState<Process | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processName, setProcessName] = useState('New Process');
    const [lastProcessId, setLastProcessId] = useState<string | undefined>(processId);

    const loadProcess = useCallback(async (id: string, retryCount: number = 0, isInitialLoad: boolean = false) => {
        console.log('[useProcess] loadProcess chamado com id:', id, 'workspaceId:', workspaceId, 'retryCount:', retryCount, 'isInitialLoad:', isInitialLoad);
        if (!token) {
            console.warn('[useProcess] Token não disponível, abortando loadProcess');
            return;
        }

        if (!id) {
            console.warn('[useProcess] Process ID não fornecido');
            return;
        }

        // Se for o primeiro load e pode ser um processo recém-criado, adicionar delay inicial
        if (isInitialLoad && retryCount === 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        setLoading(true);
        setError(null);

        try {
            const effectiveWorkspaceId = workspaceId || 'private';
            const endpoint = `/api/v1/spaces/${effectiveWorkspaceId}/processes/${id}`;
            console.log('[useProcess] Chamando API:', endpoint);
            
            const data = await apiFetch<Process>(endpoint, { token });
            console.log('[useProcess] Process carregado com sucesso:', data);

            setProcess(data);
            setProcessName(data.name);
            setError(null); // Limpar qualquer erro anterior

        } catch (err: any) {
            // Se for 404 e ainda temos tentativas, fazer retry (pode ser race condition após criação)
            // Aumentar número de tentativas e melhorar delays exponenciais
            if (err.status === 404 && retryCount < 5) {
                const delay = Math.min(300 * Math.pow(2, retryCount), 2000); // 300ms, 600ms, 1200ms, 2000ms, 2000ms
                console.log(`[useProcess] Process not found (404), retrying in ${delay}ms... (attempt ${retryCount + 1}/5)`);
                // Não definir loading como false durante retry para manter indicador visual
                await new Promise(resolve => setTimeout(resolve, delay));
                return loadProcess(id, retryCount + 1, isInitialLoad);
            }
            
            // Só logar erro e mostrar mensagem se não tiver mais tentativas
            console.error('[useProcess] Load process error (final):', err);
            console.error('[useProcess] Error details:', {
                message: err.message,
                name: err.name,
                status: err.status,
                retryCount
            });
            
            // Provide more specific error messages based on error type
            let errorMessage = 'Failed to load process';
            if (err.status === 0 || err.data?.networkError) {
                errorMessage = 'Cannot connect to API server. Please ensure the server is running.';
            } else if (err.status === 404) {
                errorMessage = 'Process not found. It may have been deleted or you may not have access.';
            } else if (err.status === 401 || err.status === 403) {
                errorMessage = 'Authentication required';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
            // Não limpar o processo existente em caso de erro, para manter o estado anterior
        } finally {
            setLoading(false);
        }
    }, [token, workspaceId]);

    // Atualizar lastProcessId quando processId mudar
    useEffect(() => {
        if (processId && processId !== lastProcessId) {
            console.log('[useProcess] processId mudou, atualizando lastProcessId:', processId);
            setLastProcessId(processId);
            // Se já temos token, carregar imediatamente
            // Marcar como initialLoad para adicionar delay se necessário (processo recém-criado)
            // Adicionar delay maior para processos recém-criados
            if (token && !authLoading) {
                // Se não temos processo atual ou o ID mudou, pode ser um processo recém-criado
                const isNewProcess = !process || process.id !== processId;
                if (isNewProcess) {
                    // Delay maior para processos recém-criados
                    setTimeout(() => {
                        loadProcess(processId, 0, true);
                    }, 500); // 500ms delay para processos novos
                } else {
                    loadProcess(processId, 0, true);
                }
            }
        }
    }, [processId, lastProcessId, token, authLoading, loadProcess, process]);

    // Recarregar processo quando o token ficar disponível
    useEffect(() => {
        if (!authLoading && token && lastProcessId && !process) {
            console.log('[useProcess] Token disponível, recarregando processo:', lastProcessId);
            loadProcess(lastProcessId, 0, true);
        }
    }, [authLoading, token, lastProcessId, process, loadProcess]);

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
        loading,
        error,
        loadProcess,
        createProcess,
        setProcessName
    };
}
