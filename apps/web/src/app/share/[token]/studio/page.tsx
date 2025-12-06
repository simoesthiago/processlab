'use client';

/**
 * Shared Project Studio Page
 * 
 * BPMN Editor for viewing/editing a shared project.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StudioContent from '@/features/bpmn/StudioContent';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SharedProjectInfo {
  project_id: string;
  project_name: string;
  process_id?: string;
  permission: 'viewer' | 'commenter' | 'editor';
}

interface PageProps {
  params: { token: string };
}

export default function SharedStudioPage({ params }: PageProps) {
  const shareToken = params.token;
  const router = useRouter();
  const { token: authToken, loading: authLoading } = useAuth();
  
  const [shareInfo, setShareInfo] = useState<SharedProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadSharedProject();
    }
  }, [shareToken, authLoading]);

  const loadSharedProject = async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(
        `${API_URL}/api/v1/shares/${shareToken}/validate`,
        { headers }
      );

      if (!response.ok) {
        setError('Unable to access this shared project.');
        return;
      }

      const data = await response.json();
      setShareInfo(data);
    } catch (err) {
      console.error('Failed to load shared project:', err);
      setError('Failed to load shared project.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading shared project...</p>
        </div>
      </div>
    );
  }

  if (error || !shareInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-destructive/10 rounded-full w-fit mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Unable to Access</CardTitle>
            <CardDescription>
              {error || 'This shared project is not available.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render studio with shared context
  // The studio will be in read-only mode if permission is 'viewer'
  return (
    <div className="relative">
      {/* Permission banner */}
      {shareInfo.permission === 'viewer' && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 text-center py-2 text-sm font-medium">
          View Only Mode - You can view but not edit this shared project
        </div>
      )}
      
      <div className={shareInfo.permission === 'viewer' ? 'pt-10' : ''}>
        <StudioContent
          processId={shareInfo.process_id}
          projectId={shareInfo.project_id}
          workspaceId={shareToken}
          workspaceType="personal"  // Shared projects are treated as personal context
          basePath={`/share/${shareToken}`}
        />
      </div>
    </div>
  );
}

