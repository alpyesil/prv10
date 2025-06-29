import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { database } from '@/lib/firebase-rest';

interface Member {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    displayName?: string;
    avatar: string;
    banner?: string;
    email?: string;
    roles: string[];
    permissions: string[];
    isOnline: boolean;
    status: 'online' | 'idle' | 'dnd' | 'offline';
    customStatus?: string;
    joinedAt: number;
    lastSeen: number;
    level: number;
    xp: number;
    badges: string[];
    stats: {
        messagesCount: number;
        voiceTimeMinutes: number;
        gamesPlayed: number;
        achievementsCount: number;
    };
    connections?: Array<{
        type: string;
        name: string;
        verified: boolean;
    }>;
    isPublic: boolean;
}

interface MembersResponse {
    members: Member[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    filters: {
        role: string;
        status: string;
        search: string;
    };
    stats: {
        totalMembers: number;
        onlineMembers: number;
        roleDistribution: Record<string, number>;
    };
}

export async function GET(request: NextRequest) {
    try {
        console.log('👥 [Members API] Request received');
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const role = searchParams.get('role') || 'all';
        const status = searchParams.get('status') || 'all';
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'joinedAt'; // joinedAt, level, activity
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Get all members from Firebase
        const membersRef = await database.ref('users');
        const snapshot = await membersRef.get();

        if (!snapshot.exists()) {
            console.log('👥 [Members API] No members found, creating sample data');
            
            // Create sample members data
            const sampleMembers = {
                'user_001': {
                    id: 'user_001',
                    discordId: '123456789012345678',
                    username: 'AlpYeşil',
                    discriminator: '0001',
                    displayName: 'Alp Yeşil',
                    avatar: 'avatar_001',
                    banner: 'banner_001',
                    email: 'alp@prv10.com',
                    roles: ['admin', 'founder'],
                    permissions: ['all'],
                    isOnline: true,
                    status: 'online',
                    customStatus: 'PRV10 Kurucusu 👑',
                    joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 365), // 1 yıl önce
                    lastSeen: Date.now(),
                    level: 50,
                    xp: 125000,
                    badges: ['founder', 'admin', 'early_supporter', 'top_contributor'],
                    stats: {
                        messagesCount: 15420,
                        voiceTimeMinutes: 48600,
                        gamesPlayed: 156,
                        achievementsCount: 89
                    },
                    connections: [
                        { type: 'steam', name: 'alpyesil', verified: true },
                        { type: 'youtube', name: 'AlpYeşil Gaming', verified: true },
                        { type: 'twitch', name: 'alpyesil_tv', verified: false }
                    ],
                    isPublic: true
                },
                'user_002': {
                    id: 'user_002',
                    discordId: '234567890123456789',
                    username: 'GameMaster',
                    discriminator: '0002',
                    displayName: 'Oyun Ustası',
                    avatar: 'avatar_002',
                    roles: ['moderator', 'game_admin'],
                    permissions: ['manage_games', 'moderate_chat'],
                    isOnline: true,
                    status: 'dnd',
                    customStatus: 'Turnuva organizasyonu 🏆',
                    joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 300), // 10 ay önce
                    lastSeen: Date.now() - (1000 * 60 * 30), // 30 dakika önce
                    level: 35,
                    xp: 87500,
                    badges: ['moderator', 'tournament_organizer', 'top_gamer'],
                    stats: {
                        messagesCount: 8750,
                        voiceTimeMinutes: 25200,
                        gamesPlayed: 298,
                        achievementsCount: 67
                    },
                    connections: [
                        { type: 'steam', name: 'gamemaster2024', verified: true },
                        { type: 'epicgames', name: 'GameMaster', verified: true }
                    ],
                    isPublic: true
                },
                'user_003': {
                    id: 'user_003',
                    discordId: '345678901234567890',
                    username: 'ProPlayer',
                    discriminator: '0003',
                    displayName: 'Pro Oyuncu',
                    avatar: 'avatar_003',
                    roles: ['vip', 'content_creator'],
                    permissions: ['create_content'],
                    isOnline: false,
                    status: 'offline',
                    customStatus: 'Stream hazırlığı 📹',
                    joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 180), // 6 ay önce
                    lastSeen: Date.now() - (1000 * 60 * 60 * 4), // 4 saat önce
                    level: 28,
                    xp: 56800,
                    badges: ['content_creator', 'skilled_player', 'active_member'],
                    stats: {
                        messagesCount: 5670,
                        voiceTimeMinutes: 18900,
                        gamesPlayed: 234,
                        achievementsCount: 45
                    },
                    connections: [
                        { type: 'twitch', name: 'proplayer_live', verified: true },
                        { type: 'youtube', name: 'ProPlayer Gaming', verified: false }
                    ],
                    isPublic: true
                },
                'user_004': {
                    id: 'user_004',
                    discordId: '456789012345678901',
                    username: 'CasualGamer',
                    discriminator: '0004',
                    displayName: 'Gündelik Oyuncu',
                    avatar: 'avatar_004',
                    roles: ['member'],
                    permissions: ['basic'],
                    isOnline: true,
                    status: 'idle',
                    customStatus: 'CS2 oynuyor 🎮',
                    joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 90), // 3 ay önce
                    lastSeen: Date.now() - (1000 * 60 * 15), // 15 dakika önce
                    level: 15,
                    xp: 23400,
                    badges: ['newcomer', 'friendly'],
                    stats: {
                        messagesCount: 2340,
                        voiceTimeMinutes: 7800,
                        gamesPlayed: 89,
                        achievementsCount: 23
                    },
                    connections: [
                        { type: 'steam', name: 'casualgamer_04', verified: false }
                    ],
                    isPublic: true
                },
                'user_005': {
                    id: 'user_005',
                    discordId: '567890123456789012',
                    username: 'TechSupport',
                    discriminator: '0005',
                    displayName: 'Teknik Destek',
                    avatar: 'avatar_005',
                    roles: ['support', 'helper'],
                    permissions: ['help_users', 'manage_support'],
                    isOnline: true,
                    status: 'online',
                    customStatus: 'Yardım için hazır 🛠️',
                    joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 120), // 4 ay önce
                    lastSeen: Date.now(),
                    level: 22,
                    xp: 44800,
                    badges: ['helper', 'tech_expert', 'reliable'],
                    stats: {
                        messagesCount: 4480,
                        voiceTimeMinutes: 12600,
                        gamesPlayed: 67,
                        achievementsCount: 34
                    },
                    connections: [
                        { type: 'github', name: 'techsupport', verified: true }
                    ],
                    isPublic: true
                }
            };

            await membersRef.set(sampleMembers);
            console.log('✅ [Members API] Sample members created');
        }

        // Get all members data
        const membersSnapshot = await membersRef.get();
        const membersData = membersSnapshot.val() || {};
        
        let members: Member[] = Object.values(membersData);

        // Filter only public members (privacy setting)
        members = members.filter(member => member.isPublic !== false);

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            members = members.filter(member =>
                member.username.toLowerCase().includes(searchLower) ||
                member.displayName?.toLowerCase().includes(searchLower) ||
                member.roles.some(role => role.toLowerCase().includes(searchLower)) ||
                member.badges.some(badge => badge.toLowerCase().includes(searchLower))
            );
        }

        // Apply role filter
        if (role && role !== 'all') {
            members = members.filter(member =>
                member.roles.some(userRole => userRole.toLowerCase() === role.toLowerCase())
            );
        }

        // Apply status filter
        if (status && status !== 'all') {
            if (status === 'online') {
                members = members.filter(member => member.isOnline && member.status === 'online');
            } else if (status === 'offline') {
                members = members.filter(member => !member.isOnline || member.status === 'offline');
            } else {
                members = members.filter(member => member.status === status);
            }
        }

        // Sort members
        members.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
                case 'level':
                    aValue = a.level || 0;
                    bValue = b.level || 0;
                    break;
                case 'activity':
                    aValue = a.lastSeen || 0;
                    bValue = b.lastSeen || 0;
                    break;
                case 'messages':
                    aValue = a.stats?.messagesCount || 0;
                    bValue = b.stats?.messagesCount || 0;
                    break;
                case 'joinedAt':
                default:
                    aValue = a.joinedAt || 0;
                    bValue = b.joinedAt || 0;
                    break;
            }

            if (sortOrder === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        // Calculate stats
        const totalMembers = members.length;
        const onlineMembers = members.filter(m => m.isOnline && m.status !== 'offline').length;
        
        const roleDistribution: Record<string, number> = {};
        members.forEach(member => {
            member.roles.forEach(role => {
                roleDistribution[role] = (roleDistribution[role] || 0) + 1;
            });
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedMembers = members.slice(startIndex, endIndex);

        // Remove sensitive data for non-admin users
        const session = await getServerSession(authOptions);
        const isAdmin = session?.user?.roles?.some(role => 
            ['admin', 'moderator'].includes(role.toLowerCase())
        );

        const sanitizedMembers = paginatedMembers.map(member => {
            const sanitized = { ...member };
            
            if (!isAdmin) {
                // Remove sensitive information for non-admin users
                delete sanitized.email;
                delete sanitized.permissions;
                
                // Hide some stats if not admin
                if (!member.isPublic) {
                    delete sanitized.stats;
                    delete sanitized.connections;
                }
            }
            
            return sanitized;
        });

        const totalPages = Math.ceil(totalMembers / limit);

        console.log(`✅ [Members API] Returning ${paginatedMembers.length} members (page ${page}/${totalPages})`);

        return NextResponse.json({
            members: sanitizedMembers,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount: totalMembers,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            filters: {
                role: role || 'all',
                status: status || 'all',
                search: search || ''
            },
            stats: {
                totalMembers,
                onlineMembers,
                roleDistribution
            }
        } as MembersResponse);

    } catch (error) {
        console.error('💥 [Members API] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}