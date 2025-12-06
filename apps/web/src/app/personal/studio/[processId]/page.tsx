'use client';

/**
 * Personal Studio Process Redirect Page
 * 
 * Redirects to the proper project-based studio URL.
 * Fetches the process to find its project and redirects accordingly.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PageProps {
  params: { processId: string };
}

export default function PersonalStudioProcessRedirectPage({ params }: PageProps) {
  const { processId } = params;
  const router = useRouter();
  const { token, isAuthenticated, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/personal/studio/${processId}`);
      return;
    }

    fetchProcessAndRedirect();
  }, [isAuthenticated, loading, token, processId]);

  const fetchProcessAndRedirect = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/processes/${processId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const process = await response.json();
        router.replace(`/personal/projects/${process.project_id}/processes/${process.id}`);
        return;
      }

      setError('Process not found');
      setTimeout(() => router.replace('/personal/projects'), 2000);

    } catch (err) {
      console.error('Failed to fetch process:', err);
      setError('Redirecting...');
      setTimeout(() => router.replace('/personal/projects'), 2000);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center">
        {error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Loading process...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

