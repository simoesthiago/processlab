'use client';

/**
 * Process Catalog Page
 * 
 * Advanced catalog with filters for status, owner, project, and search
 */

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Search, X, FileText, Loader2 } from 'lucide-react';

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
}

interface Project {
    id: string;
    name: string;
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
    const [processes, setProcesses] = useState<Process[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [projectFilter, setProjectFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchProcesses();
        }, 300);
        return () => clearTimeout(timer);
    }, [statusFilter, projectFilter, searchTerm]);

    const fetchData = async () => {
        if (!token) return;

        try {
            await Promise.all([
                fetchProjects(),
                fetchProcesses(),
            ]);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/v1/projects`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        }
    };

    const fetchProcesses = async () => {
        if (!token) return;

        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (projectFilter) params.append('project_id', projectFilter);
            if (searchTerm) params.append('search', searchTerm);

            const response = await fetch(
                `${API_URL}/api/v1/processes?${params.toString()}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setProcesses(data);
            }
        } catch (error) {
            console.error('Failed to fetch processes:', error);
        }
    };

    const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'ready':
            case 'active':
                return 'default';
            case 'draft':
                return 'secondary';
            case 'archived':
                return 'outline';
            default:
                return 'outline';
        }
    };

    const getStatusLabel = (status?: string): string => {
        switch (status) {
            case 'ready':
            case 'active':
                return 'Active';
            case 'draft':
                return 'Draft';
            case 'archived':
                return 'Archived';
            default:
                return status || 'Unknown';
        }
    };

    const clearFilters = () => {
        setStatusFilter('');
        setProjectFilter('');
        setSearchTerm('');
    };

    const hasActiveFilters = statusFilter || projectFilter || searchTerm;

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Process Catalog
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Browse and filter all processes in your organization
                    </p>
                </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or description..."
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="ready">Ready/Active</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        {/* Project Filter */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Project
                            </label>
                            <select
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">All Projects</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <div className="mt-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-muted-foreground"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Clear all filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading processes...</p>
                    </div>
                ) : processes.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <EmptyState
                                icon={FileText}
                                title={hasActiveFilters ? 'No processes found' : 'No processes yet'}
                                description={hasActiveFilters
                                    ? 'Try adjusting your filters to see more results.'
                                    : 'Create your first process to get started!'}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {processes.map((process) => (
                            <Link
                                key={process.id}
                                href={`/studio?process_id=${process.id}`}
                                className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                            >
                                <Card className="h-full hover:border-primary/50 transition-all duration-200 group-hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            {process.status && (
                                                <Badge variant={getStatusBadgeVariant(process.status)}>
                                                    {getStatusLabel(process.status)}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="group-hover:text-primary transition-colors line-clamp-1">
                                            {process.name}
                                        </CardTitle>
                                        {process.description && (
                                            <CardDescription className="line-clamp-2 mt-2">
                                                {process.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            {process.version_count !== undefined && (
                                                <span>
                                                    {process.version_count} version{process.version_count !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <span>
                                            {new Date(process.updated_at).toLocaleDateString()}
                                        </span>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
