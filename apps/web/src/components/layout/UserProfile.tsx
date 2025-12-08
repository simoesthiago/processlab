'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
    Settings,
    MoreVertical,
    User,
    LogOut
} from 'lucide-react';

export function UserProfile() {
    const { user, logout } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-accent transition-colors text-left group"
            >
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium border border-border/50">
                    {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate text-foreground group-hover:text-accent-foreground">
                        {user?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                        {user?.email}
                    </span>
                </div>
                <MoreVertical className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
            </button>

            {/* Custom Dropdown Menu */}
            {isUserMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute top-full left-4 right-4 mt-2 rounded-lg border bg-popover p-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-2 py-1.5 text-sm font-semibold">
                            My Account
                        </div>
                        <div className="h-px bg-border my-1" />
                        <Link
                            href="/settings/profile"
                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                        <div className="h-px bg-border my-1" />
                        <button
                            className="flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors"
                            onClick={() => {
                                logout();
                                setIsUserMenuOpen(false);
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
