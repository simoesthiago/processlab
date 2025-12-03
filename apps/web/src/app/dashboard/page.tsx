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
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                ProcessLab
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {user?.full_name || user?.email}
                                </span>
                                {user?.role && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                        {user.role}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                        Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage your business process models and projects
                    </p>
                </div>

                {/* Projects Section */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                            Projects
                        </h3>
                        <Link
                            href="/projects/new"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                        >
                            New Project
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                            <div className="text-4xl mb-4">📁</div>
                            <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                                No projects yet
                            </h4>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                                Create your first project to get started with process modeling
                            </p>
                            <Link
                                href="/projects/new"
                                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                            >
                                Create Project
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}/processes`}
                                    className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="text-3xl">📊</div>
                                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {project.process_count || 0} processes
                                        </div>
                                    </div>

                                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                        {project.name}
                                    </h4>

                                    {project.description && (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4">
                                            {project.description}
                                        </p>
                                    )}

                                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                                        Created {new Date(project.created_at).toLocaleDateString()}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        href="/studio"
                        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:shadow-xl transition group"
                    >
                        <div className="text-3xl mb-3">🎨</div>
                        <h4 className="text-lg font-semibold mb-2">BPMN Studio</h4>
                        <p className="text-blue-100 text-sm">
                            Create and edit BPMN diagrams with AI assistance
                        </p>
                    </Link>

                    <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 text-white rounded-xl p-6 opacity-50 cursor-not-allowed">
                        <div className="text-3xl mb-3">📈</div>
                        <h4 className="text-lg font-semibold mb-2">Analytics</h4>
                        <p className="text-zinc-300 text-sm">
                            Coming soon
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-zinc-700 to-zinc-800 text-white rounded-xl p-6 opacity-50 cursor-not-allowed">
                        <div className="text-3xl mb-3">⚙️</div>
                        <h4 className="text-lg font-semibold mb-2">Settings</h4>
                        <p className="text-zinc-300 text-sm">
                            Coming soon
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
