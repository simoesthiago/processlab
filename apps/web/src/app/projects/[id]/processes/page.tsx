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
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, FileText, Loader2, Sparkles, Plus } from 'lucide-react';

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
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-border" />
                            <h1 className="text-lg font-semibold tracking-tight">
                                {project?.name || 'Project'}
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {project?.description && (
                    <p className="text-muted-foreground mb-8">
                        {project.description}
                    </p>
                )}

                {/* Processes Section */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Processes
                        </h2>
                        <Link href={`/studio?project_id=${projectId}`}>
                            <Button>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate with AI
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : processes.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent className="pt-6">
                                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    No processes yet
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    Create your first process diagram to get started
                                </p>
                                <Link href={`/studio?project_id=${projectId}`}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Process
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {processes.map((process) => (
                                <Card key={process.id} className="hover:border-primary/50 transition-colors group">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {process.version_count || 0} versions
                                            </span>
                                        </div>
                                        <CardTitle className="group-hover:text-primary transition-colors">
                                            {process.name}
                                        </CardTitle>
                                        {process.description && (
                                            <CardDescription className="line-clamp-2 mt-2">
                                                {process.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardFooter className="flex flex-col space-y-3">
                                        <div className="text-xs text-muted-foreground w-full">
                                            Updated {new Date(process.updated_at).toLocaleDateString()}
                                        </div>
                                        <Link href={`/studio?process_id=${process.id}`} className="w-full">
                                            <Button className="w-full" variant="default">
                                                Open in Studio
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
