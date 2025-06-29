import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/firebase-rest';

interface HomeStats {
    totalMembers: number;
    onlineMembers: number;
    totalMessages: number;
    totalClans: number;
    recentAnnouncements: Array<{
        id: string;
        title: string;
        type: string;
        createdAt: number;
        author: {
            name: string;
            avatar: string;
        };
    }>;
    topGames: Array<{
        name: string;
        playerCount: number;
        icon: string;
    }>;
}

export async function GET(request: NextRequest) {
    try {
        console.log('🏠 [Home Stats API] Request received');

        // Get users data
        const usersRef = await database.ref('users');
        const usersSnapshot = await usersRef.get();
        const usersData = usersSnapshot.val() || {};
        const users = Object.values(usersData) as any[];

        // Get announcements data  
        const announcementsRef = await database.ref('announcements');
        const announcementsSnapshot = await announcementsRef.get();
        const announcementsData = announcementsSnapshot.val() || {};
        const announcements = Object.values(announcementsData) as any[];

        // Get clans data
        const clansRef = await database.ref('clans');
        const clansSnapshot = await clansRef.get();
        const clansData = clansSnapshot.val() || {};
        const clans = Object.values(clansData) as any[];

        // Calculate statistics
        const totalMembers = users.filter(u => u.isPublic !== false).length;
        const onlineMembers = users.filter(u => u.isOnline && u.status !== 'offline').length;
        
        // Calculate total messages from all users
        const totalMessages = users.reduce((sum, user) => {
            return sum + (user.stats?.messagesCount || 0);
        }, 0);

        const totalClans = clans.filter(c => c.isActive !== false).length;

        // Get recent announcements (last 3)
        const recentAnnouncements = announcements
            .filter(a => a.isVisible !== false)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 3)
            .map(announcement => ({
                id: announcement.id,
                title: announcement.title,
                type: announcement.type,
                createdAt: announcement.createdAt,
                author: {
                    name: announcement.author.name,
                    avatar: announcement.author.avatar
                }
            }));

        // Mock top games data (could be enhanced to track real game activity)
        const topGames = [
            {
                name: 'Counter-Strike 2',
                playerCount: 45,
                icon: '🔫'
            },
            {
                name: 'Valorant',
                playerCount: 32,
                icon: '🎯'
            },
            {
                name: 'League of Legends',
                playerCount: 28,
                icon: '⚔️'
            },
            {
                name: 'Apex Legends',
                playerCount: 19,
                icon: '🏆'
            },
            {
                name: 'Minecraft',
                playerCount: 15,
                icon: '🧊'
            }
        ];

        const stats: HomeStats = {
            totalMembers,
            onlineMembers,
            totalMessages,
            totalClans,
            recentAnnouncements,
            topGames
        };

        console.log('✅ [Home Stats API] Statistics calculated successfully');

        return NextResponse.json(stats);

    } catch (error) {
        console.error('💥 [Home Stats API] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}