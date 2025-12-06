'use client';

/**
 * Global Error Page
 * 
 * Displayed when an unhandled error occurs.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import { Home, RotateCw, AlertTriangle, Bug } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <Logo variant="icon" width={60} height={60} />
        </div>

        {/* Illustration */}
        <div className="relative">
          <div className="text-[120px] font-bold text-destructive/10 leading-none select-none">
            500
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-muted-foreground">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>
        </div>

        {/* Error Details (dev only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="h-4 w-4 text-destructive" />
              <p className="text-sm font-medium text-destructive">Error Details</p>
            </div>
            <code className="text-xs text-muted-foreground block overflow-x-auto">
              {error.message}
            </code>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => reset()}>
            <RotateCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Help text */}
        <div className="text-sm text-muted-foreground">
          <p>If this problem persists, please contact support.</p>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          ProcessLab © 2025
        </p>
      </div>
    </div>
  );
}

