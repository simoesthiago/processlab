'use client';

/**
 * Personal Dashboard Page
 * 
 * Main dashboard for the personal workspace.
 * Shows personal projects and shared items.
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
  User,
  Sparkles,
  Share2,
  Lock,
  Globe,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PersonalProject {
  id: string;
  name: string;
  description?: string;
  process_count?: number;
  visibility: 'private' | 'shared' | 'public';
  share_count?: number;
  created_at: string;
  updated_at: string;
}

interface SharedWithMe {
  id: string;
  project_id: string;
  project_name: string;
  owner_name: string;
  permission: 'viewer' | 'editor';
  shared_at: string;
}

export default function PersonalDashboardPage() {
  const { user, token } = useAuth();
  const { getWorkspaceBasePath } = useWorkspace();
  const [projects, setProjects] = useState<PersonalProject[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMe[]>([]);
  const [loading, setLoading] = useState(true);

  const basePath = getWorkspaceBasePath();

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      // Fetch personal projects
      const projectsResponse = await fetch(
        `${API_URL}/api/v1/users/me/projects`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (projectsResponse.ok) {
        const data = await projectsResponse.json();
        setProjects(data.projects || data || []);
      }

      // Fetch projects shared with me
      const sharedResponse = await fetch(
        `${API_URL}/api/v1/users/me/shared`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (sharedResponse.ok) {
        const data = await sharedResponse.json();
        setSharedWithMe(data.shared || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <Lock className="h-4 w-4 text-muted-foreground" />;
      case 'shared':
        return <Share2 className="h-4 w-4 text-blue-500" />;
      case 'public':
        return <Globe className="h-4 w-4 text-green-500" />;
      default:
        return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-6 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Personal Workspace
                </h1>
                <p className="text-muted-foreground">
                  Your private space for drafts and experiments
                </p>
              </div>
            </div>

            {/* Minimized Stats */}
            {!loading && (
              <div className="flex items-center gap-8 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">{projects.length}</span>
                  </div>
                  <span className="hidden sm:inline">projects</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">
                      {projects.reduce((sum, p) => sum + (p.process_count || 0), 0)}
                    </span>
                  </div>
                  <span className="hidden sm:inline">processes</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">{sharedWithMe.length}</span>
                  </div>
                  <span className="hidden sm:inline">shared</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - Primary Focus */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`${basePath}/projects/new`} className="block group">
            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all duration-200 h-full">
              <CardHeader className="pb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <PlusCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                      Create Personal Project
                    </CardTitle>
                    <CardDescription className="text-base">
                      Start a new private project for your experiments
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
          
          <Link href="/studio" className="block group">
            <Card className="border-2 hover:border-primary hover:shadow-lg transition-all duration-200 h-full">
              <CardHeader className="pb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                      Quick Draft
                    </CardTitle>
                    <CardDescription className="text-base">
                      Start a new process in your Drafts project
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* My Projects Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              My Projects
            </h2>
            <Link href={`${basePath}/projects/new`}>
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
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={FolderOpen}
                  title="No personal projects yet"
                  description="Create your first personal project to get started"
                  action={{
                    label: 'Create Project',
                    href: `${basePath}/projects/new`
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`${basePath}/projects/${project.id}`}
                  className="block group"
                >
                  <Card className="h-full hover:border-primary/50 transition-all duration-200 group-hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <BarChart className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-2">
                          {getVisibilityIcon(project.visibility)}
                          <span className="text-sm text-muted-foreground">
                            {project.process_count || 0} processes
                          </span>
                        </div>
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
                    <CardFooter className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                      </span>
                      {project.share_count && project.share_count > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          {project.share_count}
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Shared with Me Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Shared with Me
            </h2>
            <Link href={`${basePath}/shared`}>
              <Button variant="outline">
                View All
              </Button>
            </Link>
          </div>

          {sharedWithMe.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={Share2}
                  title="Nothing shared with you yet"
                  description="When someone shares a project with you, it will appear here"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedWithMe.slice(0, 6).map((shared) => (
                <Link
                  key={shared.id}
                  href={`/share/${shared.project_id}`}
                  className="block group"
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">
                          {shared.permission}
                        </span>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {shared.project_name}
                      </CardTitle>
                      <CardDescription>
                        Shared by {shared.owner_name}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <span className="text-xs text-muted-foreground">
                        Shared {new Date(shared.shared_at).toLocaleDateString()}
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}

