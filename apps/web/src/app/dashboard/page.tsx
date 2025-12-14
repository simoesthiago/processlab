'use client';

/**
 * Dashboard Page for ProcessLab
 * 
 * Main landing page after login.
 * Shows user's projects and navigation.
 */

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, FileText, FolderOpen, LogOut, Settings, BarChart } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Project {
    id: string;
    name: string;
    description?: string;
    process_count?: number;
    created_at: string;
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}

function DashboardContent() {
    const { user, logout, token } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/v1/projects`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                ProcessLab
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">
                                    {user?.full_name || user?.email}
                                </span>
                                {user?.role && (
                                    <span className="ml-2 px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                                        {user.role}
                                    </span>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">
                        Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
                    </h2>
                    <p className="text-muted-foreground">
                        Manage your business process models and projects
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/catalog" className="block">
                        <Card className="hover:bg-accent/50 transition-colors h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Process Catalog
                                </CardTitle>
                                <CardDescription>
                                    Browse and filter all processes in your organization
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                    <Link href="/projects/new" className="block">
                        <Card className="hover:bg-accent/50 transition-colors h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PlusCircle className="h-5 w-5 text-primary" />
                                    Create New Project
                                </CardTitle>
                                <CardDescription>
                                    Start a new project to organize your processes
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                </div>

                {/* Projects Section */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-semibold tracking-tight">
                            Your Projects
                        </h3>
                        <Link href="/projects/new">
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Project
                            </Button>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    ) : projects.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent className="pt-6">
                                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <FolderOpen className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h4 className="text-lg font-semibold mb-2">
                                    No projects yet
                                </h4>
                                <p className="text-muted-foreground mb-6">
                                    Create your first project to get started with process modeling
                                </p>
                                <Link href="/projects/new">
                                    <Button>Create Project</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}/processes`}
                                    className="block group"
                                >
                                    <Card className="h-full hover:border-primary/50 transition-colors">
                                        <CardHeader>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    <BarChart className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {project.process_count || 0} processes
                                                </span>
                                            </div>
                                            <CardTitle className="group-hover:text-primary transition-colors">
                                                {project.name}
                                            </CardTitle>
                                            {project.description && (
                                                <CardDescription className="line-clamp-2 mt-2">
                                                    {project.description}
                                                </CardDescription>
                                            )}
                                        </CardHeader>
                                        <CardFooter>
                                            <span className="text-xs text-muted-foreground">
                                                Created {new Date(project.created_at).toLocaleDateString()}
                                            </span>
                                        </CardFooter>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Coming Soon Features */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/studio" className="block">
                        <Card className="bg-primary text-primary-foreground border-primary h-full hover:bg-primary/90 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    BPMN Studio
                                </CardTitle>
                                <CardDescription className="text-primary-foreground/80">
                                    Create and edit BPMN diagrams with AI assistance
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>

                    <Card className="opacity-50 cursor-not-allowed h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart className="h-5 w-5" />
                                Analytics
                            </CardTitle>
                            <CardDescription>Coming soon</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="opacity-50 cursor-not-allowed h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Settings
                            </CardTitle>
                            <CardDescription>Coming soon</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </main>
        </div>
    );
}
