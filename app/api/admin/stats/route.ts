import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { database } from '@/lib/firebase-rest';

interface AdminStats {
    users: {
        total: number;
        online: number;
        newThisWeek: number;
        newThisMonth: number;
        roleDistribution: Record<string, number>;
    };
    announcements: {
        total: number;
        published: number;
        pinned: number;
        thisWeek: number;
        byType: Record<string, number>;
    };
    clans: {
        total: number;
        active: number;
        membersTotal: number;
        averageMembersPerClan: number;
    };
    activity: {
        messagesThisWeek: number;
        voiceTimeThisWeek: number;
        gamesPlayedThisWeek: number;
        activeUsersThisWeek: number;
    };
    system: {
        serverUptime: number;
        lastBackup: number;
        storageUsed: number;
        apiRequestsToday: number;
    };
}

export async function GET(request: NextRequest) {
    try {
        console.log('📊 [Admin Stats API] Request received');
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin permissions
        const userRoles = session.user.roles || [];
        const isAdmin = userRoles.some(role => 
            ['admin', 'super_admin'].includes(role.toLowerCase())
        );

        if (!isAdmin) {
            return NextResponse.json({ 
                error: 'Forbidden', 
                message: 'Admin yetkisi gereklidir' 
            }, { status: 403 });
        }

        // Get current timestamp
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const oneMonth = 30 * 24 * 60 * 60 * 1000;

        // Fetch users data
        const usersRef = await database.ref('users');
        const usersSnapshot = await usersRef.get();
        const usersData = usersSnapshot.val() || {};
        const users = Object.values(usersData) as any[];

        // Fetch announcements data
        const announcementsRef = await database.ref('announcements');
        const announcementsSnapshot = await announcementsRef.get();
        const announcementsData = announcementsSnapshot.val() || {};
        const announcements = Object.values(announcementsData) as any[];

        // Fetch clans data
        const clansRef = await database.ref('clans');
        const clansSnapshot = await clansRef.get();
        const clansData = clansSnapshot.val() || {};
        const clans = Object.values(clansData) as any[];

        // Calculate user statistics
        const onlineUsers = users.filter(u => u.isOnline && u.status !== 'offline').length;
        const newUsersThisWeek = users.filter(u => u.joinedAt > (now - oneWeek)).length;
        const newUsersThisMonth = users.filter(u => u.joinedAt > (now - oneMonth)).length;
        
        const roleDistribution: Record<string, number> = {};
        users.forEach(user => {
            user.roles?.forEach((role: string) => {
                roleDistribution[role] = (roleDistribution[role] || 0) + 1;
            });
        });

        // Calculate announcement statistics
        const publishedAnnouncements = announcements.filter(a => a.isVisible !== false).length;
        const pinnedAnnouncements = announcements.filter(a => a.pinned === true).length;
        const announcementsThisWeek = announcements.filter(a => a.createdAt > (now - oneWeek)).length;
        
        const announcementsByType: Record<string, number> = {};
        announcements.forEach(announcement => {
            const type = announcement.type || 'general';
            announcementsByType[type] = (announcementsByType[type] || 0) + 1;
        });

        // Calculate clan statistics
        const activeClans = clans.filter(c => c.isActive !== false).length;
        const totalClanMembers = clans.reduce((sum, clan) => sum + (clan.memberCount || 0), 0);
        const averageMembersPerClan = clans.length > 0 ? Math.round(totalClanMembers / clans.length) : 0;

        // Calculate activity statistics (mock data for now)
        const messagesThisWeek = users.reduce((sum, user) => {
            const userMessages = user.stats?.messagesCount || 0;
            // Estimate weekly messages as 10% of total (rough approximation)
            return sum + Math.floor(userMessages * 0.1);
        }, 0);

        const voiceTimeThisWeek = users.reduce((sum, user) => {
            const userVoiceTime = user.stats?.voiceTimeMinutes || 0;
            // Estimate weekly voice time as 15% of total
            return sum + Math.floor(userVoiceTime * 0.15);
        }, 0);

        const gamesPlayedThisWeek = users.reduce((sum, user) => {
            const userGames = user.stats?.gamesPlayed || 0;
            // Estimate weekly games as 20% of total
            return sum + Math.floor(userGames * 0.2);
        }, 0);

        const activeUsersThisWeek = users.filter(u => 
            u.lastSeen && u.lastSeen > (now - oneWeek)
        ).length;

        // System statistics (mock data)
        const systemStats = {
            serverUptime: now - (1000 * 60 * 60 * 24 * 7), // 7 days uptime
            lastBackup: now - (1000 * 60 * 60 * 6), // 6 hours ago
            storageUsed: 2.5, // GB
            apiRequestsToday: 1247
        };

        const stats: AdminStats = {
            users: {
                total: users.length,
                online: onlineUsers,
                newThisWeek: newUsersThisWeek,
                newThisMonth: newUsersThisMonth,
                roleDistribution
            },
            announcements: {
                total: announcements.length,
                published: publishedAnnouncements,
                pinned: pinnedAnnouncements,
                thisWeek: announcementsThisWeek,
                byType: announcementsByType
            },
            clans: {
                total: clans.length,
                active: activeClans,
                membersTotal: totalClanMembers,
                averageMembersPerClan
            },
            activity: {
                messagesThisWeek,
                voiceTimeThisWeek,
                gamesPlayedThisWeek,
                activeUsersThisWeek
            },
            system: systemStats
        };

        console.log('✅ [Admin Stats API] Statistics calculated successfully');

        return NextResponse.json(stats);

    } catch (error) {
        console.error('💥 [Admin Stats API] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}