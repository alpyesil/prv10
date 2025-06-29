import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface DiscordGuildMember {
    user: {
        id: string;
        username: string;
        global_name: string | null;
        avatar: string | null;
        public_flags?: number;
        premium_type?: number;
    };
    nick: string | null;
    avatar: string | null;
    roles: string[];
    joined_at: string;
    premium_since: string | null;
    deaf: boolean;
    mute: boolean;
    flags: number;
    pending?: boolean;
    permissions?: string;
    communication_disabled_until: string | null;
}

interface ProcessedFriend {
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

export async function GET(request: NextRequest) {
    try {
        console.log('👥 [Friends API] Request received');
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            console.log('❌ [Friends API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const guildId = process.env.DISCORD_GUILD_ID;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        console.log('🔧 [Friends API] Config check:', {
            hasGuildId: !!guildId,
            hasBotToken: !!botToken,
            userId: session.user.id
        });

        if (!guildId || !botToken) {
            console.log('⚠️ [Friends API] Using mock friends data');
            const mockFriends: ProcessedFriend[] = [
                {
                    id: '123456789012345678',
                    username: 'ProGamer123',
                    displayName: 'Pro Gamer',
                    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
                    nickname: 'Gaming Pro',
                    roles: ['Gamer', 'VIP'],
                    joinedAt: '2023-01-15T10:30:00Z',
                    isOnline: true,
                    mutualRoles: ['Gamer']
                },
                {
                    id: '234567890123456789',
                    username: 'DiscordMaster',
                    displayName: 'Discord Master',
                    avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
                    roles: ['Moderator', 'VIP'],
                    joinedAt: '2023-02-20T14:15:00Z',
                    isOnline: false,
                    mutualRoles: ['VIP']
                },
                {
                    id: '345678901234567890',
                    username: 'CommunityHelper',
                    displayName: 'Community Helper',
                    avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
                    nickname: 'Helper',
                    roles: ['Helper', 'Active'],
                    joinedAt: '2023-03-10T09:45:00Z',
                    isOnline: true,
                    mutualRoles: ['Active']
                }
            ];

            return NextResponse.json({
                friends: mockFriends,
                total: mockFriends.length,
                lastFetch: new Date().toISOString(),
                source: 'mock'
            });
        }

        // Discord guild members API'si
        console.log('🤖 [Friends API] Fetching guild members');
        const membersResponse = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
            {
                headers: {
                    'Authorization': `Bot ${botToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!membersResponse.ok) {
            console.log('❌ [Friends API] Failed to fetch guild members:', membersResponse.status);
            throw new Error(`Discord API error: ${membersResponse.status}`);
        }

        const membersData: DiscordGuildMember[] = await membersResponse.json();
        console.log('📊 [Friends API] Guild members fetched:', membersData.length);

        // Guild rollerini al
        const guildResponse = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}`,
            {
                headers: {
                    'Authorization': `Bot ${botToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        let guildRoles: any[] = [];
        if (guildResponse.ok) {
            const guildData = await guildResponse.json();
            guildRoles = guildData.roles;
        }

        // Kullanıcının kendi rollerini al
        const currentUser = membersData.find(member => member.user.id === session.user.id);
        const currentUserRoles = currentUser?.roles || [];

        // Guild members'ı arkadaş formatına çevir
        const friends: ProcessedFriend[] = membersData
            .filter(member =>
                member.user.id !== session.user.id && // Kendisini hariç tut
                !member.user.username.includes('bot') && // Bot'ları hariç tut
                !member.pending // Pending members'ı hariç tut
            )
            .slice(0, 50) // Max 50 arkadaş
            .map(member => {
                // Avatar URL oluştur
                const avatarUrl = member.user.avatar
                    ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.${member.user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
                    : `https://cdn.discordapp.com/embed/avatars/${parseInt(member.user.id) % 5}.png`;

                // Rol isimlerini al
                const memberRoleNames = member.roles
                    .map(roleId => {
                        const role = guildRoles.find(r => r.id === roleId);
                        return role ? role.name : null;
                    })
                    .filter(name => name !== null);

                // Ortak roller
                const mutualRoles = memberRoleNames.filter(roleName => {
                    const currentUserRoleNames = currentUserRoles.map(roleId => {
                        const role = guildRoles.find(r => r.id === roleId);
                        return role ? role.name : null;
                    });
                    return currentUserRoleNames.includes(roleName);
                });

                // Online status (mock - gerçekte presence gerekir)
                const isOnline = Math.random() > 0.3; // %70 online

                return {
                    id: member.user.id,
                    username: member.user.username,
                    displayName: member.user.global_name || member.user.username,
                    avatar: avatarUrl,
                    nickname: member.nick || undefined,
                    roles: memberRoleNames,
                    joinedAt: member.joined_at,
                    isOnline,
                    mutualRoles
                };
            })
            .sort((a, b) => {
                // Online olanları üstte göster
                if (a.isOnline && !b.isOnline) return -1;
                if (!a.isOnline && b.isOnline) return 1;

                // Sonra ortak rol sayısına göre sırala
                if (a.mutualRoles.length !== b.mutualRoles.length) {
                    return b.mutualRoles.length - a.mutualRoles.length;
                }

                // Sonra display name'e göre
                return a.displayName.localeCompare(b.displayName);
            });

        const responseData = {
            friends,
            total: friends.length,
            guildTotal: membersData.length,
            lastFetch: new Date().toISOString(),
            source: 'discord'
        };

        console.log('✅ [Friends API] Processed friends:', {
            totalMembers: membersData.length,
            friendsCount: friends.length,
            onlineFriends: friends.filter(f => f.isOnline).length
        });

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('💥 [Friends API] Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch friends',
            friends: [],
            total: 0,
            source: 'error'
        }, { status: 500 });
    }
} 