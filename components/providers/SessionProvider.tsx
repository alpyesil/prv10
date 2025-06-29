"use client";

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';

interface SessionProviderProps {
    children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
    return (
        <NextAuthSessionProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </NextAuthSessionProvider>
    );
} 