"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { database } from '@/lib/firebase';

interface ProfileComment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: number;
    likes: number;
    replies?: ProfileComment[];
}

interface ProfileActivity {
    id: string;
    type: 'game_played' | 'achievement' | 'status_update' | 'friend_added';
    title: string;
    description?: string;
    timestamp: number;
    icon?: string;
    metadata?: any;
}

interface DiscordProfile {
    profile: {
        id: string;
        username: string;
        displayName: string;
        discriminator: string;
        avatar: string;
        banner: string;
        accentColor: number;
        bio: string;
        publicFlags: number;
        premiumType: number;
        createdAt: string;
        level?: number;
        xp?: number;
        badges?: string[];
        isOnline?: boolean;
        status?: string;
        connections?: Array<{
            type: string;
            id: string;
            name: string;
            verified: boolean;
        }>;
    };
    connections: Array<{
        type: string;
        id: string;
        name: string;
        verified: boolean;
    }>;
    gaming: {
        steam?: any;
        xbox?: any;
        playstation?: any;
        epicgames?: any;
        riotgames?: any;
        battlenet?: any;
    };
    lastFetch: string;
}

interface Friend {
    id: string;
    username: string;
    discriminator: string;
    displayName: string;
    avatar: string;
    status: string;
    isOnline: boolean;
    roles: string[];
    joinedAt: string;
}

interface ProfileContextType {
    profile: DiscordProfile | null;
    friends: Friend[];
    friendsSource: string | null;
    comments: ProfileComment[];
    activities: ProfileActivity[];
    isLoading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
    children: ReactNode;
    userId: string;
}

export function ProfileProvider({ children, userId }: ProfileProviderProps) {
    const { data: session, status } = useSession();
    const [profile, setProfile] = useState<DiscordProfile | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendsSource, setFriendsSource] = useState<string | null>(null);
    const [comments, setComments] = useState<ProfileComment[]>([]);
    const [activities, setActivities] = useState<ProfileActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        if (!session?.accessToken) return;

        try {
            const response = await fetch(`/api/auth/discord/profile?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch profile');

            const data = await response.json();
            setProfile(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        }
    };

    const fetchDiscordActivities = async () => {
        if (!session?.accessToken) return;

        try {
            console.log('🎮 [ProfileContext] Fetching Discord activities');
            const response = await fetch('/api/auth/discord/activities', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ [ProfileContext] Discord activities received:', data.activities?.length);
                
                // Discord activities'i Firebase activities'e dönüştür ve ekle
                if (data.activities && data.activities.length > 0) {
                    const discordActivities = data.activities.map((activity: any) => ({
                        id: activity.id,
                        type: activity.type,
                        title: activity.title,
                        description: activity.description,
                        timestamp: activity.timestamp,
                        icon: activity.icon,
                        metadata: activity.metadata,
                        source: 'discord'
                    }));

                    // Mevcut activities ile merge et
                    setActivities(prevActivities => {
                        const merged = [...prevActivities, ...discordActivities];
                        // Timestamp'e göre sırala
                        return merged.sort((a, b) => b.timestamp - a.timestamp);
                    });
                }
            }
        } catch (err) {
            console.error('💥 [ProfileContext] Error fetching Discord activities:', err);
        }
    };

    const fetchFriends = async () => {
        if (!session?.accessToken) {
            console.log('🔍 [ProfileContext] No access token for friends fetch');
            return;
        }

        try {
            console.log('👥 [ProfileContext] Fetching friends for userId:', userId);
            const response = await fetch('/api/auth/discord/friends', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch friends');

            const data = await response.json();
            console.log('✅ [ProfileContext] Friends data received:', {
                total: data.total,
                friendsCount: data.friends?.length,
                source: data.source
            });
            setFriends(data.friends || []);
            setFriendsSource(data.source || null);
        } catch (err) {
            console.error('💥 [ProfileContext] Error fetching friends:', err);
        }
    };

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchProfile(), 
                fetchFriends(), 
                fetchDiscordActivities()
            ]);
            setIsLoading(false);
        };

        loadData();
    }, [userId, session, status]);

    // Firebase listeners for comments and activities
    useEffect(() => {
        if (!database || !userId) return;

        const commentsRef = ref(database, `profiles/${userId}/comments`);
        const activitiesRef = ref(database, `profiles/${userId}/activity`);

        const commentsListener = onValue(commentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const commentsArray = Object.entries(data).map(([id, comment]: [string, any]) => ({
                    id,
                    ...comment
                }));
                setComments(commentsArray.sort((a, b) => b.createdAt - a.createdAt));
            } else {
                setComments([]);
            }
        });

        const activitiesListener = onValue(activitiesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const activitiesArray = Object.entries(data).map(([id, activity]: [string, any]) => ({
                    id,
                    ...activity
                }));
                setActivities(activitiesArray.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setActivities([]);
            }
        });

        return () => {
            off(commentsRef, 'value', commentsListener);
            off(activitiesRef, 'value', activitiesListener);
        };
    }, [userId]);

    const refreshProfile = async () => {
        await Promise.all([fetchProfile(), fetchFriends(), fetchDiscordActivities()]);
    };

    return (
        <ProfileContext.Provider value={{
            profile,
            friends,
            friendsSource,
            comments,
            activities,
            isLoading,
            error,
            refreshProfile
        }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfileContext() {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfileContext must be used within ProfileProvider');
    }
    return context;
}