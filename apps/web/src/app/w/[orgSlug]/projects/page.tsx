'use client';

/**
 * Organization Projects Page
 * 
 * Lists all projects within the organization.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { 
  PlusCircle, 
  FolderOpen, 
  BarChart,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Project {
  id: string;
  name: string;
  description?: string;
  process_count?: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export default function OrganizationProjectsPage() {
  const { token } = useAuth();
  const { currentWorkspace, canEdit, getWorkspaceBasePath } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const basePath = getWorkspaceBasePath();

  useEffect(() => {
    if (currentWorkspace?.type === 'organization') {
      fetchProjects();
    }
  }, [currentWorkspace]);

  const fetchProjects = async () => {
    if (!token || !currentWorkspace) return;

    try {
      const response = await fetch(
        `${API_URL}/api/v1/organizations/${currentWorkspace.id}/projects`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <WorkspaceLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your process models
            </p>
          </div>
          {canEdit() && (
            <Link href={`${basePath}/projects/new`}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" disabled>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              {searchQuery ? (
                <EmptyState
                  icon={Search}
                  title="No projects found"
                  description={`No projects match "${searchQuery}"`}
                />
              ) : (
                <EmptyState
                  icon={FolderOpen}
                  title="No projects yet"
                  description={
                    canEdit()
                      ? "Create your first project to start organizing processes"
                      : "No projects have been created in this organization yet"
                  }
                  action={canEdit() ? {
                    label: 'Create Project',
                    href: `${basePath}/projects/new`
                  } : undefined}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`${basePath}/projects/${project.id}`}
                className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
              >
                <Card className="h-full hover:border-primary/50 transition-all duration-200 group-hover:shadow-md">
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
                  {project.tags && project.tags.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-muted-foreground">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  )}
                  <CardFooter>
                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}

