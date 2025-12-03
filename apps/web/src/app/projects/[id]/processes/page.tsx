'use client';

/**
 * Project Processes Page
 * 
 * Lists all processes within a project
 */

import { use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Process {
    id: string;
    name: string;
    description?: string;
    version_count?: number;
    created_at: string;
    updated_at: string;
}

interface Project {
    id: string;
    name: string;
    description?: string;
}

export default function ProjectProcessesPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);

    return (
        <ProtectedRoute>
            <ProjectProcessesContent projectId={resolvedParams.id} />
        </ProtectedRoute>
    );
}

function ProjectProcessesContent({ projectId }: { projectId: string }) {
    const { token } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjectAndProcesses();
    }, [projectId]);

    const fetchProjectAndProcesses = async () => {
        if (!token) return;

        try {
            // Fetch project details
            const projectResponse = await fetch(`${API_URL}/api/v1/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (projectResponse.ok) {
                const projectData = await projectResponse.json();
                setProject(projectData);
            }

            // Fetch processes
            const processesResponse = await fetch(
                `${API_URL}/api/v1/projects/${projectId}/processes`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            if (processesResponse.ok) {
                const processesData = await processesResponse.json();
                setProcesses(processesData);
            }
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/dashboard"
                                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                            >
                                ← Dashboard
                            </Link>
                            <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700" />
                            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                {project?.name || 'Project'}
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {project?.description && (
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                        {project.description}
                    </p>
                )}

                {/* Processes Section */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                            Processes
                        </h2>
                        <div className="flex gap-3">
                            <Link
                                href={`/studio?project_id=${projectId}`}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                            >
                                Generate with AI
                            </Link>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        </div>
                    ) : processes.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                            <div className="text-4xl mb-4">📋</div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                No processes yet
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                                Create your first process diagram to get started
                            </p>
                            <Link
                                href={`/studio?project_id=${projectId}`}
                                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                            >
                                Create Process
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {processes.map((process) => (
                                <div
                                    key={process.id}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-3xl">🔄</div>
                                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {process.version_count || 0} versions
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                        {process.name}
                                    </h3>

                                    {process.description && (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4">
                                            {process.description}
                                        </p>
                                    )}

                                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
                                        Updated {new Date(process.updated_at).toLocaleDateString()}
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/studio?process_id=${process.id}`}
                                            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition text-center"
                                        >
                                            Open in Studio
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
