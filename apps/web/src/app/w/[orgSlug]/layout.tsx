'use client';

/**
 * Organization Workspace Layout
 * 
 * Layout wrapper for all organization workspace pages.
 * Validates org access and provides workspace context.
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ProtectedRoute from '@/components/ProtectedRoute';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const resolvedParams = use(params);
  
  return (
    <ProtectedRoute>
      <WorkspaceLayoutContent orgSlug={resolvedParams.orgSlug}>
        {children}
      </WorkspaceLayoutContent>
    </ProtectedRoute>
  );
}

function WorkspaceLayoutContent({ 
  children, 
  orgSlug 
}: { 
  children: React.ReactNode; 
  orgSlug: string;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { organizations, currentWorkspace, setCurrentWorkspace, loading } = useWorkspace();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    if (loading) return;

    // Find the organization by slug
    const org = organizations.find(o => o.slug === orgSlug);

    if (!org) {
      // User doesn't have access to this organization
      console.error(`Organization not found or no access: ${orgSlug}`);
      router.push('/dashboard');
      return;
    }

    // Update current workspace if needed
    if (!currentWorkspace || 
        currentWorkspace.type !== 'organization' || 
        currentWorkspace.slug !== orgSlug) {
      setCurrentWorkspace({
        type: 'organization',
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: org.role,
      });
    }

    setIsValidating(false);
  }, [orgSlug, organizations, currentWorkspace, setCurrentWorkspace, loading, router]);

  // Show loading while validating
  if (loading || isValidating) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

