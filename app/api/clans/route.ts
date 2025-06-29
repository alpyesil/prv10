import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { database } from '@/lib/firebase-rest';

interface Clan {
    id: string;
    name: string;
    tag: string;
    description: string;
    banner: string;
    logo: string;
    game: string;
    level: number;
    xp: number;
    maxMembers: number;
    memberCount: number;
    isActive: boolean;
    isPublic: boolean;
    isRecruiting: boolean;
    createdAt: number;
    updatedAt: number;
    founder: {
        id: string;
        name: string;
        avatar: string;
    };
    leaders: string[];
    members: ClanMember[];
    stats: {
        totalMatches: number;
        wins: number;
        losses: number;
        winRate: number;
        totalTournaments: number;
        tournamentsWon: number;
        ranking: number;
    };
    requirements: {
        minLevel: number;
        minRank: string;
        applicationRequired: boolean;
        inviteOnly: boolean;
    };
    achievements: string[];
    socialLinks: {
        discord?: string;
        steam?: string;
        twitch?: string;
        youtube?: string;
    };
}

interface ClanMember {
    userId: string;
    username: string;
    avatar: string;
    role: 'founder' | 'leader' | 'officer' | 'member';
    joinedAt: number;
    contributionPoints: number;
    status: 'active' | 'inactive' | 'kicked' | 'banned';
    lastActive: number;
}

interface ClansResponse {
    clans: Clan[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    filters: {
        game: string;
        isRecruiting: boolean;
        search: string;
    };
}

export async function GET(request: NextRequest) {
    try {
        console.log('⚔️ [Clans API] GET request received');
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const game = searchParams.get('game') || '';
        const isRecruiting = searchParams.get('recruiting') === 'true';
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'level'; // level, memberCount, winRate, createdAt
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Get clans data
        const clansRef = await database.ref('clans');
        const snapshot = await clansRef.get();

        if (!snapshot.exists()) {
            console.log('⚔️ [Clans API] No clans found, creating sample data');
            
            // Create sample clans
            const sampleClans = {\n                'clan_001': {\n                    id: 'clan_001',\n                    name: 'PRV10 Elite',\n                    tag: 'PRV',\n                    description: 'PRV10 topluluğunun elit oyuncularının bulunduğu ana klan. Rekabetçi oyunlarda aktif olarak yer alıyoruz.',\n                    banner: 'https://via.placeholder.com/800x200/5865f2/ffffff?text=PRV10+Elite',\n                    logo: 'https://via.placeholder.com/128x128/5865f2/ffffff?text=PRV',\n                    game: 'Counter-Strike 2',\n                    level: 25,\n                    xp: 125000,\n                    maxMembers: 25,\n                    memberCount: 18,\n                    isActive: true,\n                    isPublic: true,\n                    isRecruiting: true,\n                    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 365), // 1 yıl önce\n                    updatedAt: Date.now() - (1000 * 60 * 60 * 2), // 2 saat önce\n                    founder: {\n                        id: 'user_001',\n                        name: 'AlpYeşil',\n                        avatar: 'avatar_001'\n                    },\n                    leaders: ['user_001', 'user_002'],\n                    members: [\n                        {\n                            userId: 'user_001',\n                            username: 'AlpYeşil',\n                            avatar: 'avatar_001',\n                            role: 'founder',\n                            joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 365),\n                            contributionPoints: 15000,\n                            status: 'active',\n                            lastActive: Date.now()\n                        },\n                        {\n                            userId: 'user_002',\n                            username: 'GameMaster',\n                            avatar: 'avatar_002',\n                            role: 'leader',\n                            joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 300),\n                            contributionPoints: 12000,\n                            status: 'active',\n                            lastActive: Date.now() - (1000 * 60 * 30)\n                        }\n                        // ... more members would be here\n                    ],\n                    stats: {\n                        totalMatches: 156,\n                        wins: 98,\n                        losses: 58,\n                        winRate: 62.8,\n                        totalTournaments: 12,\n                        tournamentsWon: 4,\n                        ranking: 3\n                    },\n                    requirements: {\n                        minLevel: 15,\n                        minRank: 'Gold Nova',\n                        applicationRequired: true,\n                        inviteOnly: false\n                    },\n                    achievements: ['tournament_winner', 'streak_master', 'elite_squad'],\n                    socialLinks: {\n                        discord: 'https://discord.gg/prv10',\n                        steam: 'https://steamcommunity.com/groups/prv10'\n                    }\n                },\n                'clan_002': {\n                    id: 'clan_002',\n                    name: 'Valorant Legends',\n                    tag: 'VL',\n                    description: 'Valorant odaklı profesyonel klan. Taktiksel oyun tarzımızla rakiplerimizi alt ediyoruz.',\n                    banner: 'https://via.placeholder.com/800x200/ff4655/ffffff?text=Valorant+Legends',\n                    logo: 'https://via.placeholder.com/128x128/ff4655/ffffff?text=VL',\n                    game: 'Valorant',\n                    level: 18,\n                    xp: 89000,\n                    maxMembers: 20,\n                    memberCount: 15,\n                    isActive: true,\n                    isPublic: true,\n                    isRecruiting: true,\n                    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 180), // 6 ay önce\n                    updatedAt: Date.now() - (1000 * 60 * 60 * 1), // 1 saat önce\n                    founder: {\n                        id: 'user_003',\n                        name: 'ProPlayer',\n                        avatar: 'avatar_003'\n                    },\n                    leaders: ['user_003'],\n                    members: [\n                        {\n                            userId: 'user_003',\n                            username: 'ProPlayer',\n                            avatar: 'avatar_003',\n                            role: 'founder',\n                            joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 180),\n                            contributionPoints: 8900,\n                            status: 'active',\n                            lastActive: Date.now() - (1000 * 60 * 60 * 4)\n                        }\n                    ],\n                    stats: {\n                        totalMatches: 89,\n                        wins: 67,\n                        losses: 22,\n                        winRate: 75.3,\n                        totalTournaments: 8,\n                        tournamentsWon: 2,\n                        ranking: 7\n                    },\n                    requirements: {\n                        minLevel: 10,\n                        minRank: 'Silver',\n                        applicationRequired: true,\n                        inviteOnly: false\n                    },\n                    achievements: ['tactical_genius', 'team_player'],\n                    socialLinks: {\n                        discord: 'https://discord.gg/valorantlegends',\n                        twitch: 'https://twitch.tv/valorantlegends'\n                    }\n                },\n                'clan_003': {\n                    id: 'clan_003',\n                    name: 'League Masters',\n                    tag: 'LM',\n                    description: 'League of Legends'da ustalaşmak isteyenler için kurulan klan. Birlikte büyüyoruz.',\n                    banner: 'https://via.placeholder.com/800x200/c89b3c/ffffff?text=League+Masters',\n                    logo: 'https://via.placeholder.com/128x128/c89b3c/ffffff?text=LM',\n                    game: 'League of Legends',\n                    level: 12,\n                    xp: 56000,\n                    maxMembers: 30,\n                    memberCount: 22,\n                    isActive: true,\n                    isPublic: true,\n                    isRecruiting: true,\n                    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 90), // 3 ay önce\n                    updatedAt: Date.now() - (1000 * 60 * 60 * 6), // 6 saat önce\n                    founder: {\n                        id: 'user_004',\n                        name: 'CasualGamer',\n                        avatar: 'avatar_004'\n                    },\n                    leaders: ['user_004'],\n                    members: [\n                        {\n                            userId: 'user_004',\n                            username: 'CasualGamer',\n                            avatar: 'avatar_004',\n                            role: 'founder',\n                            joinedAt: Date.now() - (1000 * 60 * 60 * 24 * 90),\n                            contributionPoints: 5600,\n                            status: 'active',\n                            lastActive: Date.now() - (1000 * 60 * 15)\n                        }\n                    ],\n                    stats: {\n                        totalMatches: 134,\n                        wins: 78,\n                        losses: 56,\n                        winRate: 58.2,\n                        totalTournaments: 5,\n                        tournamentsWon: 1,\n                        ranking: 12\n                    },\n                    requirements: {\n                        minLevel: 5,\n                        minRank: 'Bronze',\n                        applicationRequired: false,\n                        inviteOnly: false\n                    },\n                    achievements: ['growing_strong', 'friendly_community'],\n                    socialLinks: {\n                        discord: 'https://discord.gg/leaguemasters'\n                    }\n                }\n            };\n\n            await clansRef.set(sampleClans);\n            console.log('✅ [Clans API] Sample clans created');\n        }\n\n        // Get all clans data\n        const clansSnapshot = await clansRef.get();\n        const clansData = clansSnapshot.val() || {};\n        let clans: Clan[] = Object.values(clansData);\n\n        // Filter only active and public clans (unless admin)\n        clans = clans.filter(clan => clan.isActive !== false && clan.isPublic !== false);\n\n        // Apply search filter\n        if (search) {\n            const searchLower = search.toLowerCase();\n            clans = clans.filter(clan =>\n                clan.name.toLowerCase().includes(searchLower) ||\n                clan.tag.toLowerCase().includes(searchLower) ||\n                clan.description.toLowerCase().includes(searchLower) ||\n                clan.game.toLowerCase().includes(searchLower)\n            );\n        }\n\n        // Apply game filter\n        if (game && game !== 'all') {\n            clans = clans.filter(clan =>\n                clan.game.toLowerCase() === game.toLowerCase()\n            );\n        }\n\n        // Apply recruiting filter\n        if (isRecruiting) {\n            clans = clans.filter(clan => clan.isRecruiting === true);\n        }\n\n        // Sort clans\n        clans.sort((a, b) => {\n            let aValue: any, bValue: any;\n            \n            switch (sortBy) {\n                case 'memberCount':\n                    aValue = a.memberCount || 0;\n                    bValue = b.memberCount || 0;\n                    break;\n                case 'winRate':\n                    aValue = a.stats?.winRate || 0;\n                    bValue = b.stats?.winRate || 0;\n                    break;\n                case 'createdAt':\n                    aValue = a.createdAt || 0;\n                    bValue = b.createdAt || 0;\n                    break;\n                case 'level':\n                default:\n                    aValue = a.level || 0;\n                    bValue = b.level || 0;\n                    break;\n            }\n\n            if (sortOrder === 'asc') {\n                return aValue - bValue;\n            } else {\n                return bValue - aValue;\n            }\n        });\n\n        // Pagination\n        const totalCount = clans.length;\n        const totalPages = Math.ceil(totalCount / limit);\n        const startIndex = (page - 1) * limit;\n        const endIndex = startIndex + limit;\n        const paginatedClans = clans.slice(startIndex, endIndex);\n\n        console.log(`✅ [Clans API] Returning ${paginatedClans.length} clans (page ${page}/${totalPages})`);\n\n        return NextResponse.json({\n            clans: paginatedClans,\n            pagination: {\n                currentPage: page,\n                totalPages,\n                totalCount,\n                hasNextPage: page < totalPages,\n                hasPreviousPage: page > 1\n            },\n            filters: {\n                game: game || 'all',\n                isRecruiting: isRecruiting || false,\n                search: search || ''\n            }\n        } as ClansResponse);\n\n    } catch (error) {\n        console.error('💥 [Clans API] GET Error:', error);\n        return NextResponse.json({ \n            error: 'Internal server error',\n            message: error instanceof Error ? error.message : 'Unknown error'\n        }, { status: 500 });\n    }\n}\n\nexport async function POST(request: NextRequest) {\n    try {\n        console.log('⚔️ [Clans API] POST request received');\n        const session = await getServerSession(authOptions);\n\n        if (!session || !session.user) {\n            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n        }\n\n        const body = await request.json();\n        const { name, tag, description, game, maxMembers, requirements, socialLinks } = body;\n\n        if (!name || !tag || !game) {\n            return NextResponse.json({ \n                error: 'Bad Request', \n                message: 'Klan adı, etiketi ve oyun zorunludur' \n            }, { status: 400 });\n        }\n\n        // Check if tag is already taken\n        const clansRef = await database.ref('clans');\n        const clansSnapshot = await clansRef.get();\n        const clansData = clansSnapshot.val() || {};\n        const existingClans = Object.values(clansData) as Clan[];\n        \n        const tagExists = existingClans.some(clan => \n            clan.tag.toLowerCase() === tag.toLowerCase()\n        );\n\n        if (tagExists) {\n            return NextResponse.json({ \n                error: 'Conflict', \n                message: 'Bu etiket zaten kullanılıyor' \n            }, { status: 409 });\n        }\n\n        const clanId = `clan_${Date.now()}`;\n        const newClan: Clan = {\n            id: clanId,\n            name,\n            tag: tag.toUpperCase(),\n            description: description || '',\n            banner: '',\n            logo: '',\n            game,\n            level: 1,\n            xp: 0,\n            maxMembers: maxMembers || 20,\n            memberCount: 1,\n            isActive: true,\n            isPublic: true,\n            isRecruiting: true,\n            createdAt: Date.now(),\n            updatedAt: Date.now(),\n            founder: {\n                id: session.user.id,\n                name: session.user.name || 'Unknown User',\n                avatar: session.user.image || ''\n            },\n            leaders: [session.user.id],\n            members: [{\n                userId: session.user.id,\n                username: session.user.name || 'Unknown User',\n                avatar: session.user.image || '',\n                role: 'founder',\n                joinedAt: Date.now(),\n                contributionPoints: 0,\n                status: 'active',\n                lastActive: Date.now()\n            }],\n            stats: {\n                totalMatches: 0,\n                wins: 0,\n                losses: 0,\n                winRate: 0,\n                totalTournaments: 0,\n                tournamentsWon: 0,\n                ranking: 0\n            },\n            requirements: requirements || {\n                minLevel: 1,\n                minRank: '',\n                applicationRequired: false,\n                inviteOnly: false\n            },\n            achievements: [],\n            socialLinks: socialLinks || {}\n        };\n\n        const clanRef = database.ref(`clans/${clanId}`);\n        await clanRef.set(newClan);\n\n        console.log(`✅ [Clans API] New clan created: ${clanId}`);\n\n        return NextResponse.json(newClan, { status: 201 });\n\n    } catch (error) {\n        console.error('💥 [Clans API] POST Error:', error);\n        return NextResponse.json({ \n            error: 'Internal server error',\n            message: error instanceof Error ? error.message : 'Unknown error'\n        }, { status: 500 });\n    }\n}