'use client';

/**
 * 403 Forbidden Page
 * 
 * Displayed when access is denied.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import { Home, ArrowLeft, ShieldX, Mail } from 'lucide-react';

export default function ForbiddenPage() {
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
            403
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this resource. This might be because:
          </p>
        </div>

        {/* Reasons */}
        <div className="bg-muted/30 rounded-lg p-4 text-left">
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>You're not a member of the organization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>Your role doesn't have the required permissions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>The resource has been restricted</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        {/* Contact support */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Need access? Contact your organization administrator.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:support@processlab.app">
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          ProcessLab © 2025
        </p>
      </div>
    </div>
  );
}

