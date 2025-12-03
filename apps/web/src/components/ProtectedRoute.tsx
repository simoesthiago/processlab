'use client';

/**
 * Protected Route Component
 * 
 * Wraps components that require authentication.
 * Redirects to login if user is not authenticated.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireRole?: string[];  // Optional: require specific roles
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            // Not authenticated, redirect to login
            router.push('/login');
        } else if (!loading && isAuthenticated && requireRole) {
            // Check if user has required role
            if (!user?.role || !requireRole.includes(user.role)) {
                // User doesn't have required role
                router.push('/dashboard'); // Redirect to dashboard
            }
        }
    }, [loading, isAuthenticated, user, requireRole, router]);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-900">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!isAuthenticated) {
        return null;
    }

    // User is authenticated, render children
    return <>{children}</>;
}
