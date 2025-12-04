'use client';

/**
 * Register Page for ProcessLab
 * 
 * Allows new users to create an account.
 * Optionally creates a new organization.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Loader2, Sparkles, Building2 } from 'lucide-react';

export default function RegisterPage() {
    const { register, isAuthenticated, loading } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [createOrg, setCreateOrg] = useState(false);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);

        try {
            await register(
                email,
                password,
                fullName,
                createOrg ? organizationName : undefined
            );
            router.push('/dashboard');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Registration failed';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                {/* Logo/Title */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">
                            ProcessLab
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Create your account to get started
                    </p>
                </div>

                {/* Register Card */}
                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl">Create an account</CardTitle>
                        <CardDescription>
                            Enter your information to create your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <p className="text-sm">{error}</p>
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
                                    placeholder="John Doe"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    placeholder="••••••••"
                                    disabled={isLoading}
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
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Organization Option */}
                            <div className="pt-4 border-t space-y-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={createOrg}
                                        onChange={(e) => setCreateOrg(e.target.checked)}
                                        className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        disabled={isLoading}
                                    />
                                    <span className="text-sm font-medium">
                                        Create a new organization
                                    </span>
                                </label>

                                {createOrg && (
                                    <div className="space-y-2">
                                        <Label htmlFor="orgName" className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Organization Name
                                        </Label>
                                        <Input
                                            id="orgName"
                                            type="text"
                                            value={organizationName}
                                            onChange={(e) => setOrganizationName(e.target.value)}
                                            required={createOrg}
                                            placeholder="My Company"
                                            disabled={isLoading}
                                        />
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-6"
                                disabled={isLoading}
                                isLoading={isLoading}
                            >
                                {isLoading ? 'Creating account...' : 'Create Account'}
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
