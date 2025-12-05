'use client';

/**
 * Invitation Accept Page for ProcessLab
 * 
 * Allows users to accept organization invitations and create their account.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Loader2, Building2, User, Mail, Shield, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Logo } from '@/components/branding/Logo';

interface InvitationInfo {
    id: string;
    organization_name: string;
    organization_slug: string;
    email: string;
    role: string;
    status: string;
    is_valid: boolean;
    expires_at: string;
    inviter_name: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function InviteAcceptPage() {
    const router = useRouter();
    const params = useParams();
    const token = params?.token as string;
    const { setAuth } = useAuth();
    
    // Invitation state
    const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
    const [loadingInvitation, setLoadingInvitation] = useState(true);
    const [invitationError, setInvitationError] = useState('');
    
    // Form state
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [success, setSuccess] = useState(false);

    // Fetch invitation details on mount
    useEffect(() => {
        const fetchInvitation = async () => {
            if (!token) {
                setInvitationError('Invalid invitation link');
                setLoadingInvitation(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/v1/invitations/token/${token}`);
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || 'Invitation not found');
                }
                
                const data: InvitationInfo = await response.json();
                setInvitation(data);
                
                if (!data.is_valid) {
                    setInvitationError(getStatusMessage(data.status));
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load invitation';
                setInvitationError(errorMessage);
            } finally {
                setLoadingInvitation(false);
            }
        };

        fetchInvitation();
    }, [token]);

    const getStatusMessage = (status: string): string => {
        switch (status) {
            case 'expired':
                return 'This invitation has expired. Please request a new invitation from your organization admin.';
            case 'accepted':
                return 'This invitation has already been accepted. You can log in to your account.';
            case 'revoked':
                return 'This invitation has been revoked. Please contact your organization admin.';
            default:
                return 'This invitation is no longer valid.';
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        // Validate passwords
        if (password !== confirmPassword) {
            setSubmitError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setSubmitError('Password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/invitations/token/${token}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    full_name: fullName,
                    password: password,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to accept invitation');
            }

            const data = await response.json();
            
            // Update auth context (this also stores to localStorage)
            setAuth(data.access_token, data.user);
            
            setSuccess(true);
            
            // Redirect after success message
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (loadingInvitation) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading invitation...</p>
                </div>
            </div>
        );
    }

    // Error state (invalid/expired invitation)
    if (invitationError || !invitation) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center mb-2">
                            <Logo variant="vertical" width={120} height={120} />
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle>Invalid Invitation</CardTitle>
                            <CardDescription>
                                {invitationError || 'This invitation could not be found.'}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button asChild className="w-full">
                                <Link href="/login">Go to Login</Link>
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                If you believe this is an error, please contact your organization admin.
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center mb-2">
                            <Logo variant="vertical" width={120} height={120} />
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-success" />
                            </div>
                            <CardTitle>Welcome to {invitation.organization_name}!</CardTitle>
                            <CardDescription>
                                Your account has been created successfully. Redirecting to dashboard...
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // Main form
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-8">
            <div className="w-full max-w-md space-y-8">
                {/* Logo/Title */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center mb-2">
                        <Logo variant="vertical" width={120} height={120} />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        You're Invited!
                    </h1>
                    <p className="text-muted-foreground">
                        Join {invitation.organization_name} on ProcessLab
                    </p>
                </div>

                {/* Invitation Info Card */}
                <Card className="bg-muted/30 border-dashed">
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="text-muted-foreground">Organization: </span>
                                    <span className="font-medium">{invitation.organization_name}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="text-muted-foreground">Email: </span>
                                    <span className="font-medium">{invitation.email}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="text-muted-foreground">Role: </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                                        {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                                    </span>
                                </span>
                            </div>
                            {invitation.inviter_name && (
                                <div className="flex items-center gap-3">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        <span className="text-muted-foreground">Invited by: </span>
                                        <span className="font-medium">{invitation.inviter_name}</span>
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    <span className="text-muted-foreground">Expires: </span>
                                    <span className="font-medium">
                                        {new Date(invitation.expires_at).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Registration Form */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Create your account</CardTitle>
                        <CardDescription>
                            Complete your profile to join the organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submitError && (
                            <Alert variant="destructive" className="mb-4">
                                <p className="text-sm">{submitError}</p>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    placeholder="Your full name"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={invitation.email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    This email cannot be changed
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    minLength={8}
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum 8 characters
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                                isLoading={isSubmitting}
                            >
                                {isSubmitting ? 'Creating account...' : 'Accept Invitation & Create Account'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <div className="text-sm text-center text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Login
                            </Link>
                        </div>
                    </CardFooter>
                </Card>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        ProcessLab © 2025
                    </p>
                </div>
            </div>
        </div>
    );
}

