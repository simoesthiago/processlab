'use client';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireRole?: string[];  // Optional: require specific roles
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
    return <>{children}</>;
}
