'use client';

/**
 * Process Catalog Page
 * 
 * Advanced catalog with filters for status, owner, project, and search
 */

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, RefreshCcw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Process {
    id: string;
    name: string;
    description?: string;
    project_id: string;
    status?: string;
    created_by?: string;
    version_count?: number;
    created_at: string;
    updated_at: string;
    organization_id?: string | null;
    folder_id?: string | null;
}

interface Project {
    id: string;
    name: string;
    organization_id?: string | null;
}

interface PersonalProjectsResponse {
    projects?: Project[];
}

interface CatalogRow {
    id: string;
    name: string;
    owner: string;
    folderName: string;
    projectName: string;
    workspaceName: string;
}

export default function CatalogPage() {
    return (
        <ProtectedRoute>
            <CatalogContent />
        </ProtectedRoute>
    );
}

function CatalogContent() {
    const { token } = useAuth();
    const { organizations } = useWorkspace();

    const [rows, setRows] = useState<CatalogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const orgLookup = useMemo(() => {
        const map = new Map<string, string>();
        organizations.forEach((org) => map.set(org.id, org.name));
        return map;
    }, [organizations]);

    const fetchJson = useCallback(
        async <T,>(url: string): Promise<T | null> => {
            if (!token) return null;
            try {
                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                    console.warn(`Request failed for ${url}: ${response.status}`);
                    return null;
                }
                return (await response.json()) as T;
            } catch (err) {
                console.error(`Request error for ${url}`, err);
                return null;
            }
        },
        [token]
    );

    const fetchOrgData = useCallback(async () => {
        const [orgProcesses, orgProjects] = await Promise.all([
            fetchJson<Process[]>(`${API_URL}/api/v1/processes`),
            fetchJson<Project[]>(`${API_URL}/api/v1/projects`),
        ]);

        const projectMap = new Map<string, Project>();
        (orgProjects || []).forEach((project) => projectMap.set(project.id, project));

        return (orgProcesses || []).map<CatalogRow>((process) => ({
            id: process.id,
            name: process.name,
            owner: process.created_by || '—',
            folderName: '—',
            projectName: projectMap.get(process.project_id)?.name || 'Projeto',
            workspaceName: process.organization_id
                ? orgLookup.get(process.organization_id) || 'Workspace'
                : 'Workspace',
        }));
    }, [fetchJson, orgLookup]);

    const fetchPersonalData = useCallback(async () => {
        const personalProjectsResponse = await fetchJson<PersonalProjectsResponse>(
            `${API_URL}/api/v1/users/me/projects`
        );
        const personalProjects = personalProjectsResponse?.projects || [];

        const processesPerProject = await Promise.all(
            personalProjects.map(async (project) => {
                const processes = await fetchJson<Process[]>(
                    `${API_URL}/api/v1/projects/${project.id}/processes`
                );
                return { project, processes: processes || [] };
            })
        );

        return processesPerProject.flatMap<CatalogRow>(({ project, processes }) =>
            processes.map((process) => ({
                id: process.id,
                name: process.name,
                owner: process.created_by || '—',
                folderName: '—',
                projectName: project.name,
                workspaceName: 'Personal',
            }))
        );
    }, [fetchJson]);

    const loadCatalog = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);

        try {
            const [orgRows, personalRows] = await Promise.all([
                fetchOrgData(),
                fetchPersonalData(),
            ]);
            setRows([...(orgRows || []), ...(personalRows || [])]);
        } catch (err) {
            console.error('Failed to load catalog:', err);
            setError('Não foi possível carregar todos os processos acessíveis.');
        } finally {
            setLoading(false);
        }
    }, [fetchOrgData, fetchPersonalData, token]);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Process Catalog</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Lista única com todos os processos que você consegue acessar — pessoais, do workspace e compartilhados.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadCatalog} disabled={loading}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Atualizar
                    </Button>
                </div>

                {error && (
                    <Card className="mb-4 border-destructive/40">
                        <CardContent className="pt-4 text-sm text-destructive">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Carregando processos...</p>
                    </div>
                ) : rows.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <EmptyState
                                icon={FileText}
                                title="Nenhum processo disponível"
                                description="Assim que você tiver acesso a processos, eles aparecerão aqui."
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <div className="grid grid-cols-5 bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                            <div className="px-4 py-3">Owner</div>
                            <div className="px-4 py-3">Processo</div>
                            <div className="px-4 py-3">Pasta</div>
                            <div className="px-4 py-3">Projeto</div>
                            <div className="px-4 py-3">Workspace</div>
                        </div>
                        {rows.map((row) => (
                            <div
                                key={row.id}
                                className="grid grid-cols-5 border-t px-4 py-3 text-sm items-center hover:bg-accent/40 transition-colors"
                            >
                                <div className="truncate font-medium">{row.owner}</div>
                                <div className="truncate text-foreground">{row.name}</div>
                                <div className="truncate text-muted-foreground">{row.folderName || '—'}</div>
                                <div className="truncate text-muted-foreground">{row.projectName}</div>
                                <div className="truncate text-muted-foreground">{row.workspaceName}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
