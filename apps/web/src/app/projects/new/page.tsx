'use client';

/**
 * New Project Page
 * 
 * Form to create a new project
 */

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { FolderPlus } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function NewProjectPage() {
    return (
        <ProtectedRoute requireRole={['editor', 'admin']}>
            <NewProjectContent />
        </ProtectedRoute>
    );
}

function NewProjectContent() {
    const { user, token } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    description: description || null,
                    organization_id: user?.organization_id,
                    tags: tags ? tags.split(',').map(t => t.trim()) : null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || 'Failed to create project');
            }

            const project = await response.json();

            // Redirect to project's processes page
            router.push(`/projects/${project.id}/processes`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 space-y-2">
                    <div className="flex items-center gap-2">
                        <FolderPlus className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create New Project
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Projects help you organize related business processes
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                        <CardDescription>
                            Fill in the information below to create a new project
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <p className="text-sm">{error}</p>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Project Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g., Order Management"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    placeholder="Describe this project..."
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="e.g., finance, compliance (comma-separated)"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Separate multiple tags with commas
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    isLoading={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? 'Creating...' : 'Create Project'}
                                </Button>
                                <Link href="/dashboard">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
