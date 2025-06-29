"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email?: string;
    image?: string;
    discordId: string;
    roles: string[];
    permissions: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        console.log('🔍 [AuthProvider] Session status:', status);
        console.log('🔍 [AuthProvider] Session data:', session);

        if (status === 'loading') {
            setLoading(true);
            return;
        }

        if (session?.user) {
            const userData: User = {
                id: session.user.id || '',
                name: session.user.name || '',
                email: session.user.email || undefined,
                image: session.user.image || undefined,
                discordId: session.user.discordId || '',
                roles: session.user.roles || [],
                permissions: session.user.permissions || []
            };

            console.log('✅ [AuthProvider] User authenticated:', userData);
            setUser(userData);
        } else {
            console.log('❌ [AuthProvider] No user session found');
            setUser(null);
            
            // Token süresi dolmuşsa ve daha önce giriş yapılmışsa
            if (sessionExpired && status === 'unauthenticated') {
                router.push('/auth/signin?error=SessionRequired');
                setSessionExpired(false);
            }
        }

        setLoading(false);
    }, [session, status, sessionExpired, router]);

    const refreshUser = async () => {
        try {
            setLoading(true);
            console.log('🔄 [AuthProvider] Refreshing user data...');

            // Bu fonksiyon kullanıcı verilerini yeniden yüklemek için kullanılabilir
            // Örneğin Discord'dan güncel rol bilgilerini çekmek için

            if (session?.user) {
                const userData: User = {
                    id: session.user.id || '',
                    name: session.user.name || '',
                    email: session.user.email || undefined,
                    image: session.user.image || undefined,
                    discordId: session.user.discordId || '',
                    roles: session.user.roles || [],
                    permissions: session.user.permissions || []
                };
                setUser(userData);
                console.log('✅ [AuthProvider] User data refreshed:', userData);
            }
        } catch (error) {
            console.error('💥 [AuthProvider] Error refreshing user:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async () => {
        console.log('🔑 [AuthProvider] User login initiated');
        try {
            await signIn('discord');
        } catch (error) {
            console.error('💥 [AuthProvider] Login error:', error);
            router.push('/auth/error?error=OAuthSignin');
        }
    };

    const logout = async () => {
        console.log('🚪 [AuthProvider] User signing out');
        try {
            // Kullanıcının manuel çıkış yaptığını işaretle
            if (user) {
                setSessionExpired(false);
            }
            await signOut({ callbackUrl: '/' });
        } catch (error) {
            console.error('💥 [AuthProvider] Logout error:', error);
        }
    };

    const value: AuthContextType = {
        user,
        loading: loading || status === 'loading',
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser
    };

    console.log('🔍 [AuthProvider] Context value:', {
        hasUser: !!user,
        loading: value.loading,
        isAuthenticated: value.isAuthenticated
    });

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Yardımcı hook'lar
export function useUser() {
    const { user, loading } = useAuth();
    return { user, loading };
}

export function usePermissions() {
    const { user } = useAuth();

    const hasPermission = (permission: string): boolean => {
        return user?.permissions?.includes(permission) || false;
    };

    const hasRole = (role: string): boolean => {
        return user?.roles?.includes(role) || false;
    };

    const hasAnyRole = (roles: string[]): boolean => {
        return roles.some(role => hasRole(role));
    };

    const isAdmin = (): boolean => {
        return hasRole('admin') || hasRole('administrator') || hasPermission('admin');
    };

    const isModerator = (): boolean => {
        return hasRole('moderator') || hasRole('mod') || hasPermission('moderate');
    };

    return {
        hasPermission,
        hasRole,
        hasAnyRole,
        isAdmin,
        isModerator,
        permissions: user?.permissions || [],
        roles: user?.roles || []
    };
} 