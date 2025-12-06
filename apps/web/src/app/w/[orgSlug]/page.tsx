'use client';

/**
 * Organization Dashboard Page
 * 
 * Main dashboard for an organization workspace.
 * Shows organization projects and quick actions.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  PlusCircle,
  FileText,
  FolderOpen,
  BarChart,
  Users,
  Sparkles,
  Building2,
  Clock,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Project {
  id: string;
  name: string;
  description?: string;
  process_count?: number;
  created_at: string;
  updated_at: string;
}

interface OrgStats {
  total_projects: number;
  total_processes: number;
  total_members: number;
  recent_activity: number;
}

export default function OrganizationDashboardPage() {
  const { user, token } = useAuth();
  const { currentWorkspace, canEdit, getWorkspaceBasePath } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  const basePath = getWorkspaceBasePath();

  useEffect(() => {
    if (currentWorkspace?.type === 'organization') {
      fetchDashboardData();
    }
  }, [currentWorkspace]);

  const fetchDashboardData = async () => {
    if (!token || !currentWorkspace) return;

    try {
      // Fetch projects for this organization
      const projectsResponse = await fetch(
        `${API_URL}/api/v1/organizations/${currentWorkspace.id}/projects`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (projectsResponse.ok) {
        const data = await projectsResponse.json();
        setProjects(data.projects || data || []);
      }

      // TODO: Fetch stats when endpoint is available
      // const statsResponse = await fetch(...)

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkspaceLayout>
      <div className="px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            Overview
          </h1>
          <p className="text-base text-gray-500 max-w-2xl">
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {projects.reduce((sum, p) => sum + (p.process_count || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Processes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total_members || '-'}</p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.recent_activity || '-'}</p>
                  <p className="text-sm text-muted-foreground">Recent Updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`${basePath}/catalog`} className="block">
            <Card className="hover:bg-accent/50 transition-colors h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Process Catalog
                </CardTitle>
                <CardDescription>
                  Browse and filter all processes in this organization
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {canEdit() && (
            <Link href={`${basePath}/projects/new`} className="block">
              <Card className="hover:bg-accent/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    Create New Project
                  </CardTitle>
                  <CardDescription>
                    Start a new project to organize processes
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900 tracking-tight">
              Projects
            </h2>
            {canEdit() && (
              <Link href={`${basePath}/projects/new`}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={FolderOpen}
                  title="No projects yet"
                  description={
                    canEdit()
                      ? "Create your first project to get started with process modeling"
                      : "No projects have been created in this organization yet"
                  }
                  action={canEdit() ? {
                    label: 'Create Project',
                    href: `${basePath}/projects/new`
                  } : undefined}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
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

        {/* Studio CTA */}
        <div className="mt-12">
          <Link href={`${basePath}/projects`}>
            <Card className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  BPMN Studio
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Select a project to create and edit BPMN diagrams with AI assistance
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

