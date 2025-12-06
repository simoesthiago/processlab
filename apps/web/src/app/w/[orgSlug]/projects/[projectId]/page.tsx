'use client';

/**
 * Project Detail Page (Organization)
 * 
 * Shows project details and list of processes.
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectHierarchy } from '@/features/projects/ProjectHierarchy';
import { 
  FileText, 
  Loader2, 
  Sparkles, 
  ArrowLeft,
  Clock,
  User,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Project {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  process_count?: number;
}

interface PageProps {
  params: Promise<{ orgSlug: string; projectId: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const { currentWorkspace, canEdit, canAdmin, getWorkspaceBasePath } = useWorkspace();
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const basePath = getWorkspaceBasePath();
  const projectId = resolvedParams.projectId;

  useEffect(() => {
    fetchProjectData();
  }, [projectId, token]);

  const fetchProjectData = async () => {
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
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!token || !canAdmin()) return;
    const confirmed = confirm('Apagar este projeto? Os processos serão removidos do workspace.');
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push(`${basePath}/projects`);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspaceLayout>
    );
  }

  if (!project) {
    return (
      <WorkspaceLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={FileText}
            title="Project not found"
            description="The project you're looking for doesn't exist or you don't have access to it."
            action={{
              label: 'Back to Projects',
              href: `${basePath}/projects`
            }}
          />
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href={`${basePath}/projects`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>

        {/* Project Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mb-4">{project.description}</p>
            )}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {canEdit() && (
            <div className="flex gap-2">
              <Link href={`${basePath}/projects/${projectId}/processes/new`}>
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  New Process
                </Button>
              </Link>
              {canAdmin() && (
                <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{project.process_count ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Processes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Processes Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Processes</h2>
            {canEdit() && (
              <Link href={`${basePath}/projects/${projectId}/processes/new`}>
                <Button variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  New Process
                </Button>
              </Link>
            )}
          </div>

          <ProjectHierarchy
            projectId={projectId}
            workspaceType="organization"
            workspaceId={currentWorkspace?.id}
            basePath={basePath}
            canEdit={canEdit()}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}

