'use client';

/**
 * New Personal Project Page
 * 
 * Form to create a new personal project.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { FolderPlus, ArrowLeft, Lock, Share2, Globe, Info } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Visibility = 'private' | 'shared' | 'public';

export default function NewPersonalProjectPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { getWorkspaceBasePath } = useWorkspace();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const basePath = getWorkspaceBasePath();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description: description || null,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
          visibility,
          owner_id: user?.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || data.detail || 'Failed to create project');
      }

      const project = await response.json();

      // Redirect to the new project's page
      router.push(`${basePath}/projects/${project.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const visibilityOptions = [
    {
      value: 'private' as Visibility,
      label: 'Private',
      description: 'Only you can see and edit',
      icon: Lock,
    },
    {
      value: 'shared' as Visibility,
      label: 'Shared',
      description: 'Share with specific people',
      icon: Share2,
    },
    {
      value: 'public' as Visibility,
      label: 'Public',
      description: 'Anyone with the link can view',
      icon: Globe,
    },
  ];

  return (
    <WorkspaceLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href={`${basePath}/projects`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>

        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-2">
            <FolderPlus className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Create Personal Project
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create a private project for your personal work and experiments
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Fill in the information below to create your personal project
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
                  placeholder="e.g., My Process Draft"
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
                  placeholder="e.g., draft, experiment (comma-separated)"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>

              {/* Visibility Selection */}
              <div className="space-y-3">
                <Label>Visibility</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {visibilityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVisibility(option.value)}
                      disabled={isLoading}
                      className={`flex flex-col items-start p-4 rounded-lg border-2 transition-colors text-left ${
                        visibility === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <option.icon className={`h-4 w-4 ${
                          visibility === option.value ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
                
                {visibility === 'shared' && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg mt-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      You can manage sharing settings after creating the project
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
                </Button>
                <Link href={`${basePath}/projects`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}

