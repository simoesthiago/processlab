'use client';

/**
 * Organization Settings Page
 * 
 * General organization settings and information.
 */

import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { currentWorkspace } = useWorkspace();
  const [copied, setCopied] = useState(false);

  const handleCopySlug = async () => {
    if (currentWorkspace?.slug) {
      await navigator.clipboard.writeText(currentWorkspace.slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="px-8 py-10 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">Organization Settings</h1>
        <p className="text-base text-gray-500 max-w-2xl">
          Manage your organization's general settings and information.
        </p>
      </div>

      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Basic information about your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={currentWorkspace?.name || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgSlug">Organization Slug</Label>
            <div className="flex gap-2">
              <Input
                id="orgSlug"
                value={currentWorkspace?.slug || ''}
                disabled
                className="bg-muted font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopySlug}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used in URLs: processlab.app/w/{currentWorkspace?.slug}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Your Role</Label>
            <div>
              <Badge variant={currentWorkspace?.role === 'admin' ? 'default' : 'secondary'}>
                {currentWorkspace?.role?.charAt(0).toUpperCase() + (currentWorkspace?.role?.slice(1) || '')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that affect your entire organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium">Delete Organization</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all its data.
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

