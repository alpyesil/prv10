"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, off, set, serverTimestamp } from 'firebase/database';
import { User } from '../firebase';

export const useAuth = () => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'loading') return;

        if (session?.user?.id) {
            // Firebase'den kullanıcı dinle
            const userRef = ref(database, `users/${session.user.id}`);

            const unsubscribe = onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    setUser(snapshot.val());
                } else {
                    setUser(null);
                }
                setLoading(false);
            });

            // Kullanıcının online durumunu güncelle
            const updateOnlineStatus = async () => {
                await set(ref(database, `users/${session.user!.id}/isOnline`), true);
                await set(ref(database, `users/${session.user!.id}/lastSeen`), serverTimestamp());
            };

            updateOnlineStatus();

            // Sayfa kapatıldığında offline yap
            const handleBeforeUnload = async () => {
                await set(ref(database, `users/${session.user!.id}/isOnline`), false);
                await set(ref(database, `users/${session.user!.id}/lastSeen`), serverTimestamp());
            };

            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                off(userRef);
                window.removeEventListener('beforeunload', handleBeforeUnload);
                // Cleanup sırasında da offline yap
                if (session?.user?.id) {
                    set(ref(database, `users/${session.user.id}/isOnline`), false);
                    set(ref(database, `users/${session.user.id}/lastSeen`), serverTimestamp());
                }
            };
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [session, status]);

    const login = () => {
        signIn('discord');
    };

    const logout = async () => {
        if (user?.id) {
            // Çıkış yapmadan önce offline yap
            await set(ref(database, `users/${user.id}/isOnline`), false);
            await set(ref(database, `users/${user.id}/lastSeen`), serverTimestamp());
        }
        signOut();
    };

    return {
        user,
        session,
        loading: loading || status === 'loading',
        isAuthenticated: !!session,
        login,
        logout,
    };
}; 