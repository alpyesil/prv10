import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

interface DiscordGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
    features: string[];
    permissions_new: string;
}

interface DiscordRole {
    id: string;
    name: string;
    color: number;
    hoist: boolean;
    icon: string | null;
    unicode_emoji: string | null;
    position: number;
    permissions: string;
    managed: boolean;
    mentionable: boolean;
}

interface DiscordGuildMember {
    user: {
        id: string;
        username: string;
        global_name: string | null;
        avatar: string | null;
    };
    nick: string | null;
    avatar: string | null;
    roles: string[];
    joined_at: string;
    premium_since: string | null;
    permissions: string;
}

interface DiscordGuildInfo {
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
    owner_id: string;
    region: string;
    afk_timeout: number;
    verification_level: number;
    default_message_notifications: number;
    explicit_content_filter: number;
    roles: DiscordRole[];
    emojis: any[];
    features: string[];
    mfa_level: number;
    application_id: string | null;
    system_channel_id: string | null;
    system_channel_flags: number;
    rules_channel_id: string | null;
    max_presences: number | null;
    max_members: number;
    vanity_url_code: string | null;
    premium_tier: number;
    premium_subscription_count: number;
    preferred_locale: string;
    public_updates_channel_id: string | null;
    nsfw_level: number;
    premium_progress_bar_enabled: boolean;
}

// Discord Permission Names ve İkonları
const DISCORD_PERMISSIONS = {
    CREATE_INSTANT_INVITE: { name: 'Davet Oluşturma', icon: '📨', color: 'bg-blue-500', description: 'Sunucuya davet bağlantısı oluşturabilir' },
    KICK_MEMBERS: { name: 'Üye Atma', icon: '👢', color: 'bg-orange-500', description: 'Üyeleri sunucudan atabilir' },
    BAN_MEMBERS: { name: 'Üye Yasaklama', icon: '🔨', color: 'bg-red-500', description: 'Üyeleri sunucudan yasaklayabilir' },
    ADMINISTRATOR: { name: 'Yönetici', icon: '👑', color: 'bg-yellow-500', description: 'Tam yönetici yetkisi' },
    MANAGE_CHANNELS: { name: 'Kanal Yönetimi', icon: '📋', color: 'bg-purple-500', description: 'Kanalları yönetebilir' },
    MANAGE_GUILD: { name: 'Sunucu Yönetimi', icon: '⚙️', color: 'bg-gray-500', description: 'Sunucu ayarlarını değiştirebilir' },
    ADD_REACTIONS: { name: 'Tepki Ekleme', icon: '😄', color: 'bg-green-500', description: 'Mesajlara tepki ekleyebilir' },
    VIEW_AUDIT_LOG: { name: 'Denetim Günlüğü', icon: '📜', color: 'bg-indigo-500', description: 'Sunucu denetim günlüğünü görüntüleyebilir' },
    PRIORITY_SPEAKER: { name: 'Öncelikli Konuşmacı', icon: '📢', color: 'bg-pink-500', description: 'Ses kanallarında öncelikli konuşma' },
    STREAM: { name: 'Yayın', icon: '📹', color: 'bg-red-400', description: 'Ses kanallarında yayın yapabilir' },
    VIEW_CHANNEL: { name: 'Kanal Görme', icon: '👁️', color: 'bg-gray-400', description: 'Kanalları görüntüleyebilir' },
    SEND_MESSAGES: { name: 'Mesaj Gönderme', icon: '💬', color: 'bg-blue-400', description: 'Mesaj gönderebilir' },
    SEND_TTS_MESSAGES: { name: 'TTS Mesaj', icon: '🔊', color: 'bg-cyan-500', description: 'Metin okuma mesajları gönderebilir' },
    MANAGE_MESSAGES: { name: 'Mesaj Yönetimi', icon: '🗑️', color: 'bg-orange-400', description: 'Mesajları silebilir ve düzenleyebilir' },
    EMBED_LINKS: { name: 'Bağlantı Gömme', icon: '🔗', color: 'bg-teal-500', description: 'Bağlantıları gömebilir' },
    ATTACH_FILES: { name: 'Dosya Ekleme', icon: '📎', color: 'bg-green-400', description: 'Dosya ekleyebilir' },
    READ_MESSAGE_HISTORY: { name: 'Mesaj Geçmişi', icon: '📚', color: 'bg-blue-300', description: 'Mesaj geçmişini okuyabilir' },
    MENTION_EVERYONE: { name: 'Herkesi Etiketleme', icon: '📣', color: 'bg-red-400', description: '@everyone ve @here kullanabilir' },
    USE_EXTERNAL_EMOJIS: { name: 'Dış Emoji', icon: '😀', color: 'bg-yellow-400', description: 'Diğer sunucuların emojilerini kullanabilir' },
    VIEW_GUILD_INSIGHTS: { name: 'Sunucu İstatistikleri', icon: '📊', color: 'bg-purple-400', description: 'Sunucu analizlerini görüntüleyebilir' },
    CONNECT: { name: 'Bağlanma', icon: '🔌', color: 'bg-green-300', description: 'Ses kanallarına bağlanabilir' },
    SPEAK: { name: 'Konuşma', icon: '🎤', color: 'bg-blue-500', description: 'Ses kanallarında konuşabilir' },
    MUTE_MEMBERS: { name: 'Üye Susturma', icon: '🔇', color: 'bg-orange-500', description: 'Üyeleri sessize alabilir' },
    DEAFEN_MEMBERS: { name: 'Üye Sağırlaştırma', icon: '🔈', color: 'bg-red-300', description: 'Üyeleri sağırlaştırabilir' },
    MOVE_MEMBERS: { name: 'Üye Taşıma', icon: '↗️', color: 'bg-indigo-400', description: 'Üyeleri farklı kanallara taşıyabilir' },
    USE_VAD: { name: 'Ses Aktivasyonu', icon: '🎵', color: 'bg-cyan-400', description: 'Tuşa basarak konuşma kullanabilir' },
    CHANGE_NICKNAME: { name: 'Takma Ad Değiştirme', icon: '📝', color: 'bg-teal-400', description: 'Kendi takma adını değiştirebilir' },
    MANAGE_NICKNAMES: { name: 'Takma Ad Yönetimi', icon: '✏️', color: 'bg-purple-300', description: 'Diğer üyelerin takma adlarını değiştirebilir' },
    MANAGE_ROLES: { name: 'Rol Yönetimi', icon: '🎭', color: 'bg-pink-400', description: 'Rolleri yönetebilir' },
    MANAGE_WEBHOOKS: { name: 'Webhook Yönetimi', icon: '🪝', color: 'bg-gray-600', description: 'Webhook\'ları yönetebilir' },
    MANAGE_EMOJIS_AND_STICKERS: { name: 'Emoji Yönetimi', icon: '😊', color: 'bg-yellow-300', description: 'Emojileri yönetebilir' },
    USE_APPLICATION_COMMANDS: { name: 'Slash Komutlar', icon: '⚡', color: 'bg-cyan-600', description: 'Slash komutlarını kullanabilir' },
    REQUEST_TO_SPEAK: { name: 'Konuşma İsteği', icon: '✋', color: 'bg-indigo-300', description: 'Stage kanallarında konuşma isteyebilir' },
    MANAGE_EVENTS: { name: 'Etkinlik Yönetimi', icon: '📅', color: 'bg-green-600', description: 'Sunucu etkinliklerini yönetebilir' },
    MANAGE_THREADS: { name: 'Thread Yönetimi', icon: '🧵', color: 'bg-blue-600', description: 'Thread\'leri yönetebilir' },
    CREATE_PUBLIC_THREADS: { name: 'Herkese Açık Thread', icon: '🔓', color: 'bg-green-500', description: 'Herkese açık thread oluşturabilir' },
    CREATE_PRIVATE_THREADS: { name: 'Özel Thread', icon: '🔒', color: 'bg-orange-600', description: 'Özel thread oluşturabilir' },
    USE_EXTERNAL_STICKERS: { name: 'Dış Sticker', icon: '🎨', color: 'bg-pink-300', description: 'Diğer sunucuların stickerlarını kullanabilir' },
    SEND_MESSAGES_IN_THREADS: { name: 'Thread\'de Mesaj', icon: '💭', color: 'bg-teal-300', description: 'Thread\'lerde mesaj gönderebilir' },
    USE_EMBEDDED_ACTIVITIES: { name: 'Gömülü Aktiviteler', icon: '🎮', color: 'bg-purple-600', description: 'Ses kanallarında oyun oynayabilir' },
    MODERATE_MEMBERS: { name: 'Üye Moderasyonu', icon: '⚖️', color: 'bg-red-600', description: 'Üyeleri timeout\'a alabilir' }
};

function parsePermissions(permissionsBit: string): string[] {
    const permissions = BigInt(permissionsBit);
    const permissionList: string[] = [];

    // Discord permission bit positions
    const permissionBits: { [key: string]: bigint } = {
        CREATE_INSTANT_INVITE: BigInt(1) << BigInt(0),
        KICK_MEMBERS: BigInt(1) << BigInt(1),
        BAN_MEMBERS: BigInt(1) << BigInt(2),
        ADMINISTRATOR: BigInt(1) << BigInt(3),
        MANAGE_CHANNELS: BigInt(1) << BigInt(4),
        MANAGE_GUILD: BigInt(1) << BigInt(5),
        ADD_REACTIONS: BigInt(1) << BigInt(6),
        VIEW_AUDIT_LOG: BigInt(1) << BigInt(7),
        PRIORITY_SPEAKER: BigInt(1) << BigInt(8),
        STREAM: BigInt(1) << BigInt(9),
        VIEW_CHANNEL: BigInt(1) << BigInt(10),
        SEND_MESSAGES: BigInt(1) << BigInt(11),
        SEND_TTS_MESSAGES: BigInt(1) << BigInt(12),
        MANAGE_MESSAGES: BigInt(1) << BigInt(13),
        EMBED_LINKS: BigInt(1) << BigInt(14),
        ATTACH_FILES: BigInt(1) << BigInt(15),
        READ_MESSAGE_HISTORY: BigInt(1) << BigInt(16),
        MENTION_EVERYONE: BigInt(1) << BigInt(17),
        USE_EXTERNAL_EMOJIS: BigInt(1) << BigInt(18),
        VIEW_GUILD_INSIGHTS: BigInt(1) << BigInt(19),
        CONNECT: BigInt(1) << BigInt(20),
        SPEAK: BigInt(1) << BigInt(21),
        MUTE_MEMBERS: BigInt(1) << BigInt(22),
        DEAFEN_MEMBERS: BigInt(1) << BigInt(23),
        MOVE_MEMBERS: BigInt(1) << BigInt(24),
        USE_VAD: BigInt(1) << BigInt(25),
        CHANGE_NICKNAME: BigInt(1) << BigInt(26),
        MANAGE_NICKNAMES: BigInt(1) << BigInt(27),
        MANAGE_ROLES: BigInt(1) << BigInt(28),
        MANAGE_WEBHOOKS: BigInt(1) << BigInt(29),
        MANAGE_EMOJIS_AND_STICKERS: BigInt(1) << BigInt(30),
        USE_APPLICATION_COMMANDS: BigInt(1) << BigInt(31),
        REQUEST_TO_SPEAK: BigInt(1) << BigInt(32),
        MANAGE_EVENTS: BigInt(1) << BigInt(33),
        MANAGE_THREADS: BigInt(1) << BigInt(34),
        CREATE_PUBLIC_THREADS: BigInt(1) << BigInt(35),
        CREATE_PRIVATE_THREADS: BigInt(1) << BigInt(36),
        USE_EXTERNAL_STICKERS: BigInt(1) << BigInt(37),
        SEND_MESSAGES_IN_THREADS: BigInt(1) << BigInt(38),
        USE_EMBEDDED_ACTIVITIES: BigInt(1) << BigInt(39),
        MODERATE_MEMBERS: BigInt(1) << BigInt(40)
    };

    for (const [permission, bit] of Object.entries(permissionBits)) {
        if ((permissions & bit) === bit) {
            permissionList.push(permission);
        }
    }

    return permissionList;
}

function calculateLevel(guildCreatedAt: string, userJoinedAt: string): { level: number, xp: number, nextLevelXp: number, progress: number } {
    const guildDate = new Date(guildCreatedAt);
    const joinDate = new Date(userJoinedAt);
    const now = new Date();

    // Sunucunun toplam yaşı (gün cinsinden)
    const guildAgeInDays = Math.floor((now.getTime() - guildDate.getTime()) / (1000 * 60 * 60 * 24));

    // Kullanıcının sunucudaki süresi (gün cinsinden)
    const userDaysInGuild = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

    // Maksimum seviye 100, minimum 1
    // Kullanıcının sunucudaki süresinin, sunucunun toplam yaşına oranı
    const membershipRatio = Math.min(userDaysInGuild / Math.max(guildAgeInDays, 1), 1);

    // Seviye hesaplaması (1-100 arası)
    const baseLevel = Math.floor(membershipRatio * 99) + 1; // 1-100 arası

    // Aktivite bonusu (her 10 gün için +1 bonus seviye, max +10)
    const activityBonus = Math.min(Math.floor(userDaysInGuild / 10), 10);

    const level = Math.min(baseLevel + activityBonus, 100);

    // XP hesaplaması
    const xpPerLevel = 1000;
    const currentLevelXp = (level - 1) * xpPerLevel;
    const nextLevelXp = level * xpPerLevel;

    // Günlük aktiflik bonusu
    const dailyBonus = userDaysInGuild * 50; // Her gün için 50 XP
    const xp = currentLevelXp + dailyBonus;

    // İlerleme yüzdesi
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

    return {
        level,
        xp,
        nextLevelXp,
        progress: Math.min(progress, 100)
    };
}

export async function GET(request: NextRequest) {
    try {
        console.log('🏰 [Discord Guild API] Request received');

        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Discord Guild API] No session found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const guildId = process.env.DISCORD_GUILD_ID;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        if (!guildId || !botToken) {
            console.log('⚠️ [Discord Guild API] Missing guild ID or bot token');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Sunucu bilgilerini çek
        const guildResponse = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!guildResponse.ok) {
            console.log('❌ [Discord Guild API] Failed to fetch guild info:', guildResponse.status);
            return NextResponse.json({ error: 'Failed to fetch guild info' }, { status: guildResponse.status });
        }

        const guildInfo: DiscordGuildInfo = await guildResponse.json();

        // Kullanıcının guild member bilgilerini çek
        const memberResponse = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${session.user.discordId}`, {
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!memberResponse.ok) {
            console.log('❌ [Discord Guild API] Failed to fetch member info:', memberResponse.status);
            return NextResponse.json({ error: 'User not found in guild' }, { status: 404 });
        }

        const memberInfo: DiscordGuildMember = await memberResponse.json();

        // Kullanıcının rollerini al ve izinlerini hesapla
        const userRoles = memberInfo.roles.map(roleId => {
            const role = guildInfo.roles.find(r => r.id === roleId);
            return role;
        }).filter(role => role !== undefined);

        // Tüm izinleri birleştir
        let combinedPermissions = BigInt(0);
        userRoles.forEach(role => {
            if (role) {
                combinedPermissions |= BigInt(role.permissions);
            }
        });

        // İzinleri parse et
        const userPermissions = parsePermissions(combinedPermissions.toString());

        // Sunucu oluşturma tarihini hesapla (Discord Snowflake'den)
        const guildCreatedAt = new Date(Number((BigInt(guildId) >> BigInt(22)) + BigInt(1420070400000))).toISOString();

        // Seviye hesaplaması
        const levelData = calculateLevel(guildCreatedAt, memberInfo.joined_at);

        // Permission badges oluştur
        const permissionBadges = userPermissions
            .filter(perm => DISCORD_PERMISSIONS[perm as keyof typeof DISCORD_PERMISSIONS])
            .map(perm => {
                const permData = DISCORD_PERMISSIONS[perm as keyof typeof DISCORD_PERMISSIONS];
                return {
                    id: perm,
                    name: permData.name,
                    icon: permData.icon,
                    color: permData.color,
                    description: permData.description,
                    type: 'permission' as const
                };
            });

        const responseData = {
            guild: {
                id: guildInfo.id,
                name: guildInfo.name,
                icon: guildInfo.icon ? `https://cdn.discordapp.com/icons/${guildInfo.id}/${guildInfo.icon}.png?size=512` : null,
                description: guildInfo.description,
                memberCount: guildInfo.max_members,
                createdAt: guildCreatedAt,
                premiumTier: guildInfo.premium_tier,
                features: guildInfo.features
            },
            member: {
                userId: memberInfo.user.id,
                nickname: memberInfo.nick,
                joinedAt: memberInfo.joined_at,
                premiumSince: memberInfo.premium_since,
                roles: userRoles.map(role => ({
                    id: role!.id,
                    name: role!.name,
                    color: role!.color,
                    position: role!.position,
                    permissions: role!.permissions
                })),
                permissions: userPermissions,
                permissionBadges,
                levelData: levelData
            },
            lastFetch: new Date().toISOString()
        };

        console.log('✅ [Discord Guild API] Guild data prepared successfully');
        return NextResponse.json(responseData);

    } catch (error) {
        console.error('💥 [Discord Guild API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 