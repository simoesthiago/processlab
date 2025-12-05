'use client';

/**
 * Members Settings Page
 * 
 * Manage team members and invitations.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Mail,
  Clock,
  Check,
  X,
  Loader2,
  AlertCircle,
  UserPlus,
  RotateCw,
  Copy,
  Trash2,
  Shield
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Invitation {
  id: string;
  organization_id: string;
  organization_name: string | null;
  email: string;
  role: string;
  status: string;
  token: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  invited_by: string;
  inviter_name: string | null;
}

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLES = [
  { value: 'viewer', label: 'Viewer', description: 'Can view processes' },
  { value: 'editor', label: 'Editor', description: 'Can edit processes' },
  { value: 'admin', label: 'Admin', description: 'Full organization access' },
];

const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'bg-destructive/10 text-destructive';
    case 'editor':
      return 'bg-primary/10 text-primary';
    case 'reviewer':
      return 'bg-warning/10 text-warning';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case 'accepted':
      return <Badge variant="outline" className="bg-green-500/10 text-green-600"><Check className="h-3 w-3 mr-1" />Accepted</Badge>;
    case 'expired':
      return <Badge variant="outline" className="bg-muted text-muted-foreground"><X className="h-3 w-3 mr-1" />Expired</Badge>;
    case 'revoked':
      return <Badge variant="outline" className="bg-destructive/10 text-destructive"><X className="h-3 w-3 mr-1" />Revoked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function MembersPage() {
  const { token, user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  
  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  
  // Invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  
  const [error, setError] = useState('');
  
  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  
  // Copy state
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  // Delete confirmation
  const [deleteInviteId, setDeleteInviteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === 'admin';

  // Fetch members
  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch(`${API_URL}/api/v1/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch invitations
  const fetchInvitations = async () => {
    if (!isAdmin) {
      setLoadingInvitations(false);
      return;
    }

    try {
      setLoadingInvitations(true);
      const response = await fetch(`${API_URL}/api/v1/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) return;
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data.items);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [token, isAdmin]);

  // Create invitation
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/v1/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          expires_in_days: 7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send invitation');
      }

      setInviteEmail('');
      setInviteRole('viewer');
      setInviteOpen(false);
      fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  // Copy invitation link
  const handleCopyInviteLink = async (invitation: Invitation) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/invite/${invitation.token}`;
    
    await navigator.clipboard.writeText(link);
    setCopiedToken(invitation.id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Resend invitation
  const handleResend = async (invitationId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
    }
  };

  // Revoke invitation
  const handleRevoke = async (invitationId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`${API_URL}/api/v1/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invitation');
      }

      setDeleteInviteId(null);
      fetchInvitations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    } finally {
      setDeleting(false);
    }
  };

  const pendingInvitations = invitations.filter(i => i.status === 'pending');
  const pastInvitations = invitations.filter(i => i.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage team members and invitations for {currentWorkspace?.name}.
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join {currentWorkspace?.name}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="space-y-2">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => setInviteRole(role.value)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          inviteRole === role.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{role.label}</p>
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                          </div>
                          {inviteRole === role.value && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <p className="ml-2">{error}</p>
                </Alert>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Error Alert */}
      {error && !inviteOpen && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </Alert>
      )}

      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? 's' : ''} in this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No members yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {(member.full_name || member.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.full_name || 'No name'}
                        {member.id === user?.id && (
                          <span className="text-muted-foreground text-sm ml-2">(you)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  
                  <Badge className={getRoleBadgeColor(member.role || 'viewer')}>
                    {(member.role || 'viewer').charAt(0).toUpperCase() + (member.role || 'viewer').slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {isAdmin && pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invitation.email}</p>
                      {getStatusBadge(invitation.status)}
                      <Badge className={getRoleBadgeColor(invitation.role)}>
                        {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyInviteLink(invitation)}
                    >
                      {copiedToken === invitation.id ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResend(invitation.id)}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    
                    <Dialog open={deleteInviteId === invitation.id} onOpenChange={(open) => setDeleteInviteId(open ? invitation.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Revoke Invitation</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to revoke the invitation for {invitation.email}?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteInviteId(null)}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleRevoke(invitation.id)}
                            disabled={deleting}
                          >
                            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Revoke
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Invitations */}
      {isAdmin && pastInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              Past Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastInvitations.slice(0, 5).map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 rounded-lg border opacity-60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invitation.email}</p>
                      {getStatusBadge(invitation.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invitation.status === 'accepted' 
                        ? `Accepted ${new Date(invitation.accepted_at!).toLocaleDateString()}`
                        : `Sent ${new Date(invitation.created_at).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-admin notice */}
      {!isAdmin && (
        <Alert>
          <Shield className="h-4 w-4" />
          <div className="ml-2">
            <p className="font-medium">Limited Access</p>
            <p className="text-sm text-muted-foreground">
              Only administrators can invite new members and manage invitations.
            </p>
          </div>
        </Alert>
      )}
    </div>
  );
}

