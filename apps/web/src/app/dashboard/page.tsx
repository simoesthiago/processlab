'use client';

/**
 * Main Dashboard Page for ProcessLab
 * 
 * Central hub showing all workspaces (organizations and personal).
 * Allows users to select and navigate to their workspaces.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace, Organization } from '@/contexts/WorkspaceContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Building2,
  User,
  FolderOpen,
  FileText,
  ArrowRight,
  Plus,
  PlusCircle,
  Sparkles,
  Share2,
  Clock,
  Users,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RecentActivity {
  id: string;
  type: 'process_created' | 'version_saved' | 'project_created';
  title: string;
  workspace_name: string;
  workspace_slug: string;
  workspace_type: 'organization' | 'personal';
  created_at: string;
}

interface PersonalStats {
  project_count: number;
  process_count: number;
  shared_with_me: number;
}

interface SharedWithMeItem {
  id: string;
  project_id: string;
  project_name: string;
  owner_name: string;
  permission: 'viewer' | 'editor';
  shared_at: string;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { organizations, loading: workspaceLoading, setCurrentWorkspace } = useWorkspace();

  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedWithMeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      // Fetch personal workspace stats
      const statsResponse = await fetch(`${API_URL}/api/v1/users/me/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setPersonalStats(data);
      }

      // Fetch items shared with the user
      const sharedResponse = await fetch(`${API_URL}/api/v1/users/me/shared`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (sharedResponse.ok) {
        const data = await sharedResponse.json();
        setSharedWithMe(data.shared || data || []);
      }

      // Fetch recent activity
      const activityResponse = await fetch(`${API_URL}/api/v1/users/me/activity`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (activityResponse.ok) {
        const data = await activityResponse.json();
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = (org: Organization) => {
    setCurrentWorkspace({
      type: 'organization',
      id: org.id,
      name: org.name,
      slug: org.slug,
      role: org.role,
    });
    router.push(`/w/${org.slug}`);
  };

  const handleSelectPersonal = () => {
    if (!user) return;
    setCurrentWorkspace({
      type: 'personal',
      id: user.id,
      name: 'Personal',
      slug: 'personal',
      role: 'owner',
    });
    router.push('/personal');
  };

  return (
    <AppLayout>
      <div className="px-8 py-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
            Overview
          </h1>
          <p className="text-base text-gray-500 max-w-2xl">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-gray-900 tracking-tight mb-4">
            Your Workspaces
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Personal Workspace Card */}
            <Card
              className="hover:border-primary/50 transition-all duration-200 cursor-pointer group hover:shadow-md"
              onClick={handleSelectPersonal}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                    <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  Personal Space
                </CardTitle>
                <CardDescription>
                  Your private workspace for drafts and experiments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FolderOpen className="h-4 w-4" />
                    <span>{personalStats?.project_count || 0} projects</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{personalStats?.process_count || 0} processes</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  Owner
                </span>
              </CardFooter>
            </Card>

            {/* Organization Workspace Cards */}
            {workspaceLoading ? (
              <Card className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-32 bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ) : (
              organizations.map((org) => (
                <Card
                  key={org.id}
                  className="hover:border-primary/50 transition-all duration-200 cursor-pointer group hover:shadow-md"
                  onClick={() => handleSelectOrganization(org)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {org.name}
                    </CardTitle>
                    {org.description && (
                      <CardDescription className="line-clamp-2">
                        {org.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Team</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${org.role === 'admin'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : org.role === 'editor'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                      {org.role}
                    </span>
                  </CardFooter>
                </Card>
              ))
            )}

            {/* Create/Join Organization Card */}
            <Card className="border-dashed hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="pt-6 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <div className="p-3 bg-muted rounded-xl mb-4 group-hover:bg-primary/10 transition-colors">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Create or Join Organization
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up a new team workspace
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-gray-900 tracking-tight mb-4">
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/personal/studio">
              <Card className="hover:bg-accent/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Criar processo rápido
                  </CardTitle>
                  <CardDescription>
                    Abre o estúdio e cria um processo no seu espaço pessoal (Drafts).
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/personal/projects/new">
              <Card className="hover:bg-accent/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    Criar projeto pessoal
                  </CardTitle>
                  <CardDescription>
                    Cria um novo projeto diretamente na sua pasta pessoal.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Shared with me */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900 tracking-tight">Compartilhados com você</h2>
            <Link href="/personal/shared">
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>

          {sharedWithMe.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={Share2}
                  title="Nada compartilhado ainda"
                  description="Quando alguém compartilhar um projeto ou pasta com você, ele aparecerá aqui."
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
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Share2 className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">
                          {shared.permission}
                        </span>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {shared.project_name}
                      </CardTitle>
                      <CardDescription>
                        Compartilhado por {shared.owner_name}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <span className="text-xs text-muted-foreground">
                        Desde {new Date(shared.shared_at).toLocaleDateString()}
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 tracking-tight mb-4">
            Recent Activity
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={Clock}
                  title="No recent activity"
                  description="Your recent work will appear here"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${activity.workspace_type === 'personal'
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                        {activity.type === 'process_created' && (
                          <FileText className={`h-4 w-4 ${activity.workspace_type === 'personal'
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-blue-600 dark:text-blue-400'
                            }`} />
                        )}
                        {activity.type === 'version_saved' && (
                          <Clock className={`h-4 w-4 ${activity.workspace_type === 'personal'
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-blue-600 dark:text-blue-400'
                            }`} />
                        )}
                        {activity.type === 'project_created' && (
                          <FolderOpen className={`h-4 w-4 ${activity.workspace_type === 'personal'
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-blue-600 dark:text-blue-400'
                            }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          in {activity.workspace_name}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
