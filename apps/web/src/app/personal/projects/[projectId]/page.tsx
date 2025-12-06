'use client';

/**
 * Personal Project Detail Page
 * 
 * Shows project details, processes, and sharing settings.
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Loader2, 
  Sparkles, 
  ArrowLeft,
  Settings,
  Share2,
  Lock,
  Globe,
  Clock,
  MoreHorizontal,
  Plus,
  Copy,
  Trash,
} from 'lucide-react';

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
  visibility: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface Share {
  id: string;
  permission: string;
  share_token: string;
  share_url: string;
  is_public_link: boolean;
  shared_with_email?: string;
  expires_at?: string;
  created_at: string;
}

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function PersonalProjectDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const { getWorkspaceBasePath } = useWorkspace();
  
  const [project, setProject] = useState<Project | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

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

      // Fetch processes
      const processesResponse = await fetch(
        `${API_URL}/api/v1/projects/${projectId}/processes`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (processesResponse.ok) {
        const processesData = await processesResponse.json();
        setProcesses(processesData.processes || processesData || []);
      }

      // Fetch shares
      const sharesResponse = await fetch(
        `${API_URL}/api/v1/shares/project/${projectId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (sharesResponse.ok) {
        const sharesData = await sharesResponse.json();
        setShares(sharesData.shares || []);
      }
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async (isPublicLink: boolean, permission: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          permission,
          is_public_link: isPublicLink,
        }),
      });

      if (response.ok) {
        await fetchProjectData(); // Refresh shares
      }
    } catch (error) {
      console.error('Failed to create share:', error);
    }
  };

  const handleCopyShareLink = (shareUrl: string, token: string) => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/v1/shares/${shareId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await fetchProjectData(); // Refresh shares
    } catch (error) {
      console.error('Failed to revoke share:', error);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <Lock className="h-4 w-4" />;
      case 'shared':
        return <Share2 className="h-4 w-4" />;
      case 'public':
        return <Globe className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
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
              onClick: () => {},
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
            <div className="flex items-center gap-3 mb-2">
              {getVisibilityIcon(project.visibility)}
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            </div>
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
          
          <div className="flex gap-2">
            <Link href={`${basePath}/projects/${projectId}/processes/new`}>
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                New Process
              </Button>
            </Link>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="processes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="processes">
              <FileText className="h-4 w-4 mr-2" />
              Processes
            </TabsTrigger>
            <TabsTrigger value="sharing">
              <Share2 className="h-4 w-4 mr-2" />
              Sharing
            </TabsTrigger>
          </TabsList>

          {/* Processes Tab */}
          <TabsContent value="processes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Processes</h2>
              <Link href={`${basePath}/projects/${projectId}/processes/new`}>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Process
                </Button>
              </Link>
            </div>

            {processes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    icon={FileText}
                    title="No processes yet"
                    description="Create your first process diagram to get started"
                    action={{
                      label: 'Create Process',
                      onClick: () => {},
                      href: `${basePath}/projects/${projectId}/processes/new`
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processes.map((process) => (
                  <Card key={process.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-base">{process.name}</CardTitle>
                      {process.description && (
                        <CardDescription className="line-clamp-2">
                          {process.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardFooter className="flex-col gap-3">
                      <div className="text-xs text-muted-foreground w-full">
                        {process.version_count || 0} versions
                      </div>
                      <Link href={`${basePath}/projects/${projectId}/processes/${process.id}`} className="w-full">
                        <Button className="w-full" size="sm">
                          Open in Studio
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sharing Tab */}
          <TabsContent value="sharing" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Sharing Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage who can access this project
                </p>
              </div>
              <Button onClick={() => handleCreateShare(true, 'viewer')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Share Link
              </Button>
            </div>

            {/* Active Shares */}
            {shares.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    icon={Share2}
                    title="No shares yet"
                    description="Create a share link to give others access to this project"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {shares.map((share) => (
                  <Card key={share.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {share.is_public_link ? (
                              <>
                                <Globe className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Public Link</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  {share.shared_with_email || 'Direct Share'}
                                </span>
                              </>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                              {share.permission}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded font-mono truncate">
                              {share.share_url}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyShareLink(share.share_url, share.share_token)}
                            >
                              {copiedToken === share.share_token ? (
                                <span className="text-green-600">Copied!</span>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Created {new Date(share.created_at).toLocaleDateString()}
                            </div>
                            {share.expires_at && (
                              <div className="flex items-center gap-1">
                                Expires {new Date(share.expires_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeShare(share.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </WorkspaceLayout>
  );
}

