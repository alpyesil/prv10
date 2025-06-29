"use client";

import { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove, serverTimestamp } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useSession } from 'next-auth/react';

interface ProfileComment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: number;
    likes: number;
    likedBy: string[];
    replies?: ProfileComment[];
}

interface ProfileActivity {
    id: string;
    type: 'game_session' | 'achievement' | 'friend_add' | 'level_up' | 'screenshot' | 'review';
    title: string;
    description: string;
    timestamp: number;
    game?: string;
    image?: string;
    metadata?: Record<string, any>;
}

interface DiscordProfileData {
    profile: {
        id: string;
        username: string;
        globalName: string | null;
        avatar: string;
        banner: string;
        accentColor: number | null;
        premiumType?: number;
        publicFlags?: number;
    };
    connections: Array<{
        type: string;
        id: string;
        name: string;
        verified: boolean;
        showActivity: boolean;
        visibility: number;
    }>;
    gaming?: Record<string, any>;
    lastFetch: string;
}

interface DiscordFriend {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    nickname?: string;
    roles: string[];
    joinedAt: string;
    isOnline: boolean;
    mutualRoles: string[];
}

interface DiscordFriendsData {
    friends: DiscordFriend[];
    total: number;
    guildTotal?: number;
    lastFetch: string;
    source: 'discord' | 'mock' | 'error';
}

export function useProfile(userId: string) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<ProfileComment[]>([]);
    const [activities, setActivities] = useState<ProfileActivity[]>([]);
    const [discordProfile, setDiscordProfile] = useState<DiscordProfileData | null>(null);
    const [friends, setFriends] = useState<DiscordFriendsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Debug: Log hook initialization
    useEffect(() => {
        console.log('🔍 [useProfile] Hook initialized for userId:', userId);
        console.log('🔍 [useProfile] Session status:', {
            hasSession: !!session,
            userId: session?.user?.id,
            sessionUser: session?.user
        });
        console.log('🔍 [useProfile] Firebase database object:', database);
    }, [userId, session]);

    // Fetch Discord profile data
    useEffect(() => {
        async function fetchDiscordProfile() {
            try {
                console.log('🔍 [useProfile] Fetching Discord profile for:', userId);

                const response = await fetch('/api/auth/discord/profile');
                console.log('🔍 [useProfile] Discord API response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ [useProfile] Discord profile data:', data);
                    setDiscordProfile(data);
                } else {
                    const errorText = await response.text();
                    console.log('⚠️ [useProfile] Discord profile fetch failed:', response.status, errorText);
                }
            } catch (error) {
                console.error('💥 [useProfile] Discord profile fetch error:', error);
                setError('Failed to fetch Discord profile');
            }
        }

        if (session?.user && userId === session.user.id) {
            fetchDiscordProfile();
        } else {
            console.log('⚠️ [useProfile] Skipping Discord profile fetch - not own profile or no session');
        }
    }, [userId, session]);

    // Fetch Discord friends data
    useEffect(() => {
        async function fetchDiscordFriends() {
            try {
                console.log('👥 [useProfile] Fetching Discord friends');

                const response = await fetch('/api/auth/discord/friends');
                console.log('👥 [useProfile] Friends API response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ [useProfile] Friends data:', data);
                    setFriends(data);
                } else {
                    const errorText = await response.text();
                    console.log('⚠️ [useProfile] Friends fetch failed:', response.status, errorText);
                }
            } catch (error) {
                console.error('💥 [useProfile] Friends fetch error:', error);
                setError('Failed to fetch friends');
            }
        }

        if (session?.user) {
            fetchDiscordFriends();
        }
    }, [session]);

    // Real-time comments listener
    useEffect(() => {
        console.log('🔄 [useProfile] Setting up comments listener for userId:', userId);

        try {
            const commentsRef = ref(database, `profiles/${userId}/comments`);
            console.log('🔄 [useProfile] Comments reference created:', commentsRef.toString());

            const unsubscribe = onValue(commentsRef, (snapshot) => {
                try {
                    console.log('🔄 [useProfile] Comments snapshot received:', {
                        exists: snapshot.exists(),
                        key: snapshot.key,
                        size: snapshot.size
                    });

                    if (snapshot.exists()) {
                        const commentsData = snapshot.val();
                        console.log('🔄 [useProfile] Raw comments data:', commentsData);

                        const commentsList: ProfileComment[] = Object.entries(commentsData).map(([key, value]: [string, any]) => ({
                            id: key,
                            ...value,
                        })).sort((a, b) => b.timestamp - a.timestamp);

                        console.log('✅ [useProfile] Processed comments:', commentsList);
                        setComments(commentsList);
                    } else {
                        console.log('📭 [useProfile] No comments found in database');
                        setComments([]);
                    }
                } catch (error) {
                    console.error('💥 [useProfile] Comments processing error:', error);
                    setError('Failed to process comments');
                }
            }, (error) => {
                console.error('💥 [useProfile] Comments listener error:', error);
                setError(`Comments listener failed: ${error.message}`);
            });

            return () => {
                console.log('🔌 [useProfile] Unsubscribing from comments listener');
                unsubscribe();
            };
        } catch (error) {
            console.error('💥 [useProfile] Comments listener setup error:', error);
            setError(`Comments setup failed: ${error}`);
        }
    }, [userId]);

    // Real-time activities listener
    useEffect(() => {
        console.log('🔄 [useProfile] Setting up activities listener for userId:', userId);

        try {
            const activitiesRef = ref(database, `profiles/${userId}/activity`);
            console.log('🔄 [useProfile] Activities reference created:', activitiesRef.toString());

            const unsubscribe = onValue(activitiesRef, (snapshot) => {
                try {
                    console.log('🔄 [useProfile] Activities snapshot received:', {
                        exists: snapshot.exists(),
                        key: snapshot.key,
                        size: snapshot.size
                    });

                    if (snapshot.exists()) {
                        const activitiesData = snapshot.val();
                        console.log('🔄 [useProfile] Raw activities data:', activitiesData);

                        const activitiesList: ProfileActivity[] = Object.entries(activitiesData).map(([key, value]: [string, any]) => ({
                            id: key,
                            ...value,
                        })).sort((a, b) => b.timestamp - a.timestamp);

                        console.log('✅ [useProfile] Processed activities:', activitiesList);
                        setActivities(activitiesList);
                    } else {
                        console.log('📭 [useProfile] No activities found in database');
                        setActivities([]);
                    }
                    setLoading(false);
                } catch (error) {
                    console.error('💥 [useProfile] Activities processing error:', error);
                    setError('Failed to process activities');
                    setLoading(false);
                }
            }, (error) => {
                console.error('💥 [useProfile] Activities listener error:', error);
                setError(`Activities listener failed: ${error.message}`);
                setLoading(false);
            });

            return () => {
                console.log('🔌 [useProfile] Unsubscribing from activities listener');
                unsubscribe();
            };
        } catch (error) {
            console.error('💥 [useProfile] Activities listener setup error:', error);
            setError(`Activities setup failed: ${error}`);
            setLoading(false);
        }
    }, [userId]);

    // Add comment function
    const addComment = async (content: string): Promise<boolean> => {
        if (!session?.user || !content.trim()) {
            console.log('⚠️ [useProfile] Cannot add comment: no session or empty content');
            return false;
        }

        try {
            console.log('💬 [useProfile] Adding comment:', content);

            const commentsRef = ref(database, `profiles/${userId}/comments`);
            const newCommentRef = push(commentsRef);

            const commentData: Omit<ProfileComment, 'id'> = {
                authorId: session.user.id,
                authorName: session.user.name || 'Unknown User',
                authorAvatar: session.user.image || '',
                content: content.trim(),
                timestamp: Date.now(),
                likes: 0,
                likedBy: [],
            };

            console.log('💬 [useProfile] Comment data to save:', commentData);
            await set(newCommentRef, commentData);
            console.log('✅ [useProfile] Comment added successfully');
            return true;
        } catch (error) {
            console.error('💥 [useProfile] Add comment error:', error);
            setError('Failed to add comment');
            return false;
        }
    };

    // Like comment function
    const likeComment = async (commentId: string): Promise<boolean> => {
        if (!session?.user) {
            console.log('⚠️ [useProfile] Cannot like comment: no session');
            return false;
        }

        try {
            console.log('❤️ [useProfile] Toggling like for comment:', commentId);

            const comment = comments.find(c => c.id === commentId);
            if (!comment) {
                console.log('⚠️ [useProfile] Comment not found:', commentId);
                return false;
            }

            const isLiked = comment.likedBy.includes(session.user.id);
            const newLikedBy = isLiked
                ? comment.likedBy.filter(id => id !== session.user.id)
                : [...comment.likedBy, session.user.id];

            const commentRef = ref(database, `profiles/${userId}/comments/${commentId}`);
            const updatedComment = {
                ...comment,
                likes: newLikedBy.length,
                likedBy: newLikedBy,
            };

            console.log('❤️ [useProfile] Updated comment data:', updatedComment);
            await set(commentRef, updatedComment);
            console.log('✅ [useProfile] Comment like toggled successfully');
            return true;
        } catch (error) {
            console.error('💥 [useProfile] Like comment error:', error);
            setError('Failed to like comment');
            return false;
        }
    };

    // Delete comment function
    const deleteComment = async (commentId: string): Promise<boolean> => {
        if (!session?.user) {
            console.log('⚠️ [useProfile] Cannot delete comment: no session');
            return false;
        }

        try {
            console.log('🗑️ [useProfile] Deleting comment:', commentId);

            const comment = comments.find(c => c.id === commentId);
            if (!comment || comment.authorId !== session.user.id) {
                console.log('⚠️ [useProfile] Cannot delete: comment not found or not owner');
                return false;
            }

            const commentRef = ref(database, `profiles/${userId}/comments/${commentId}`);
            await remove(commentRef);

            console.log('✅ [useProfile] Comment deleted successfully');
            return true;
        } catch (error) {
            console.error('💥 [useProfile] Delete comment error:', error);
            setError('Failed to delete comment');
            return false;
        }
    };

    // Add activity function
    const addActivity = async (activity: Omit<ProfileActivity, 'id' | 'timestamp'>): Promise<boolean> => {
        if (!session?.user || session.user.id !== userId) {
            console.log('⚠️ [useProfile] Cannot add activity: no session or not own profile');
            return false;
        }

        try {
            console.log('📈 [useProfile] Adding activity:', activity);

            const activitiesRef = ref(database, `profiles/${userId}/activity`);
            const newActivityRef = push(activitiesRef);

            const activityData: Omit<ProfileActivity, 'id'> = {
                ...activity,
                timestamp: Date.now(),
            };

            console.log('📈 [useProfile] Activity data to save:', activityData);
            await set(newActivityRef, activityData);
            console.log('✅ [useProfile] Activity added successfully');
            return true;
        } catch (error) {
            console.error('💥 [useProfile] Add activity error:', error);
            setError('Failed to add activity');
            return false;
        }
    };

    // Test function to add sample data
    const addSampleData = async () => {
        if (!session?.user) return;

        console.log('🧪 [useProfile] Adding sample data...');

        // Add sample comment
        await addComment('Bu profile test yorumu! 🎮');

        // Add sample activity
        await addActivity({
            type: 'game_session',
            title: 'Counter-Strike 2 oynadı',
            description: '2 saat 30 dakika oynama süresi',
            game: 'Counter-Strike 2',
            metadata: { playtime: '2h 30m', kills: 25, deaths: 12 }
        });

        console.log('✅ [useProfile] Sample data added');
    };

    return {
        // Data
        comments,
        activities,
        discordProfile,
        friends,
        loading,
        error,

        // Actions
        addComment,
        likeComment,
        deleteComment,
        addActivity,

        // Debug
        addSampleData,
    };
} 