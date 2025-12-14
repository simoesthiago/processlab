'use client';

/**
 * 404 Not Found Page
 * 
 * Displayed when a page is not found.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import { Home, ArrowLeft, Search, FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <Logo variant="icon" width={60} height={60} />
        </div>

        {/* Illustration */}
        <div className="relative">
          <div className="text-[120px] font-bold text-muted/20 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-muted/50">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Page Not Found
          </h1>
          <p className="text-muted-foreground">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-muted/30 rounded-lg p-4 text-left">
          <p className="text-sm font-medium mb-2">Here are some helpful links:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Check the URL for typos</li>
            <li>• Go back to the previous page</li>
            <li>• Return to your dashboard</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Link href="/spaces/private">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Private Space
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          ProcessLab © 2025
        </p>
      </div>
    </div>
  );
}

