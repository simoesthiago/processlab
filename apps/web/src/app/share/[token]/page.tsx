'use client';

/**
 * Shared Project Access Page
 * 
 * Allows viewing/editing a shared project via share token or direct share.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Loader2, 
  Lock, 
  AlertCircle, 
  User,
  Eye,
  Edit,
  ArrowLeft,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SharedProjectInfo {
  project_id: string;
  project_name: string;
  project_description?: string;
  owner_name: string;
  permission: 'viewer' | 'commenter' | 'editor';
  is_public_link: boolean;
}

interface PageProps {
  params: { token: string };
}

export default function SharedProjectPage({ params }: PageProps) {
  const shareToken = params.token;
  const router = useRouter();
  const { isAuthenticated, token: authToken, loading: authLoading } = useAuth();
  
  const [shareInfo, setShareInfo] = useState<SharedProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      validateShareAccess();
    }
  }, [shareToken, authLoading, isAuthenticated]);

  const validateShareAccess = async () => {
    setLoading(true);
    setError(null);

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
        if (response.status === 404) {
          setError('This share link is invalid or has expired.');
        } else if (response.status === 401) {
          // Need to authenticate
          setError('auth_required');
        } else {
          setError('Unable to access this shared project.');
        }
        return;
      }

      const data = await response.json();
      setShareInfo(data);
    } catch (err) {
      console.error('Failed to validate share:', err);
      setError('Failed to load shared project.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = () => {
    if (!shareInfo) return;
    
    // Navigate to the studio with shared context
    router.push(`/share/${shareToken}/studio`);
  };

  // Loading state
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

  // Auth required error
  if (error === 'auth_required') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit mb-4">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to view this shared project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/login?redirect=/share/${shareToken}`} className="block">
              <Button className="w-full">
                Sign In to Continue
              </Button>
            </Link>
            <Link href={`/register?redirect=/share/${shareToken}`} className="block">
              <Button variant="outline" className="w-full">
                Create an Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generic error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 bg-destructive/10 rounded-full w-fit mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Unable to Access</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Share info loaded
  if (shareInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{shareInfo.project_name}</CardTitle>
                {shareInfo.project_description && (
                  <CardDescription className="mt-1">
                    {shareInfo.project_description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Owner info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-background rounded-full">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Shared by</p>
                <p className="text-sm text-muted-foreground">{shareInfo.owner_name}</p>
              </div>
            </div>

            {/* Permission info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 bg-background rounded-full">
                {shareInfo.permission === 'viewer' ? (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Edit className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Your access level</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {shareInfo.permission}
                  {shareInfo.permission === 'viewer' && ' - View only'}
                  {shareInfo.permission === 'editor' && ' - Can edit'}
                  {shareInfo.permission === 'commenter' && ' - Can comment'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleOpenProject}>
                Open Project
              </Button>
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button variant="outline">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

