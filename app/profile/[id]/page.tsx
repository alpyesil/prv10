"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { ProfileHeader, ProfileGames, ProfileComments, ProfileActivity, ProfileFriends, ProfileEdit } from '@/components/Profile';
import Layout from '@/components/Layout';
import { useAuth } from '@/components/providers/AuthContext';
import { ProfileSkeleton, Loading } from '@/components/ui/loading';
import { ProfileProvider } from '@/components/providers/ProfileContext';

interface UserData {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    banner: string;
    joinedAt: string;
    lastSeen: string;
    isOnline: boolean;
    level: number;
    xp: number;
    nextLevelXp: number;
    progress: number;
    roles: string[];
    permissions: string[];
    highestRole: string;
    status: string;
    location: string;
    bio: string;
    stats: {
        totalPlaytime: string;
        gamesOwned: number;
        achievements: number;
        friends: number;
        screenshots: number;
        reviews: number;
    };
    badges: Array<{
        id?: string;
        name: string;
        icon: string;
        color?: string;
        description: string;
        type?: 'permission' | 'achievement' | 'special';
    }>;
    guildData?: {
        guild: any;
        member: any;
        levelData: any;
    };
}

// Discord Permission İsimleri
const DISCORD_PERMISSIONS = {
    CREATE_INSTANT_INVITE: { name: 'Davet Oluşturma', icon: '📨', description: 'Sunucuya davet bağlantısı oluşturabilir' },
    KICK_MEMBERS: { name: 'Üye Atma', icon: '👢', description: 'Üyeleri sunucudan atabilir' },
    BAN_MEMBERS: { name: 'Üye Yasaklama', icon: '🔨', description: 'Üyeleri sunucudan yasaklayabilir' },
    ADMINISTRATOR: { name: 'Yönetici', icon: '👑', description: 'Tam yönetici yetkisi' },
    MANAGE_CHANNELS: { name: 'Kanal Yönetimi', icon: '📋', description: 'Kanalları yönetebilir' },
    MANAGE_GUILD: { name: 'Sunucu Yönetimi', icon: '⚙️', description: 'Sunucu ayarlarını değiştirebilir' },
    ADD_REACTIONS: { name: 'Tepki Ekleme', icon: '😄', description: 'Mesajlara tepki ekleyebilir' },
    VIEW_AUDIT_LOG: { name: 'Denetim Günlüğü', icon: '📜', description: 'Sunucu denetim günlüğünü görüntüleyebilir' },
    PRIORITY_SPEAKER: { name: 'Öncelikli Konuşmacı', icon: '📢', description: 'Ses kanallarında öncelikli konuşma' },
    STREAM: { name: 'Yayın', icon: '📹', description: 'Ses kanallarında yayın yapabilir' },
    VIEW_CHANNEL: { name: 'Kanal Görme', icon: '👁️', description: 'Kanalları görüntüleyebilir' },
    SEND_MESSAGES: { name: 'Mesaj Gönderme', icon: '💬', description: 'Mesaj gönderebilir' },
    SEND_TTS_MESSAGES: { name: 'TTS Mesaj', icon: '🔊', description: 'Metin okuma mesajları gönderebilir' },
    MANAGE_MESSAGES: { name: 'Mesaj Yönetimi', icon: '🗑️', description: 'Mesajları silebilir ve düzenleyebilir' },
    EMBED_LINKS: { name: 'Bağlantı Gömme', icon: '🔗', description: 'Bağlantıları gömebilir' },
    ATTACH_FILES: { name: 'Dosya Ekleme', icon: '📎', description: 'Dosya ekleyebilir' },
    READ_MESSAGE_HISTORY: { name: 'Mesaj Geçmişi', icon: '📚', description: 'Mesaj geçmişini okuyabilir' },
    MENTION_EVERYONE: { name: 'Herkesi Etiketleme', icon: '📣', description: '@everyone ve @here kullanabilir' },
    USE_EXTERNAL_EMOJIS: { name: 'Dış Emoji', icon: '😀', description: 'Diğer sunucuların emojilerini kullanabilir' },
    CONNECT: { name: 'Bağlanma', icon: '🔌', description: 'Ses kanallarına bağlanabilir' },
    SPEAK: { name: 'Konuşma', icon: '🎤', description: 'Ses kanallarında konuşabilir' },
    MUTE_MEMBERS: { name: 'Üye Susturma', icon: '🔇', description: 'Üyeleri sessize alabilir' },
    DEAFEN_MEMBERS: { name: 'Üye Sağırlaştırma', icon: '🔈', description: 'Üyeleri sağırlaştırabilir' },
    MOVE_MEMBERS: { name: 'Üye Taşıma', icon: '↗️', description: 'Üyeleri farklı kanallara taşıyabilir' },
    USE_VAD: { name: 'Ses Aktivasyonu', icon: '🎵', description: 'Tuşa basarak konuşma kullanabilir' },
    CHANGE_NICKNAME: { name: 'Takma Ad Değiştirme', icon: '📝', description: 'Kendi takma adını değiştirebilir' },
    MANAGE_NICKNAMES: { name: 'Takma Ad Yönetimi', icon: '✏️', description: 'Diğer üyelerin takma adlarını değiştirebilir' },
    MANAGE_ROLES: { name: 'Rol Yönetimi', icon: '🎭', description: 'Rolleri yönetebilir' },
    MANAGE_WEBHOOKS: { name: 'Webhook Yönetimi', icon: '🪝', description: 'Webhook\'ları yönetebilir' },
    MANAGE_EMOJIS: { name: 'Emoji Yönetimi', icon: '😊', description: 'Emojileri yönetebilir' }
};

export default function ProfilePage() {
    const params = useParams();
    const { user: currentUser } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const userId = params?.id as string;
    const isOwnProfile = currentUser?.id === userId || currentUser?.discordId === userId;

    useEffect(() => {
        if (!userId) {
            setError('Kullanıcı ID\'si bulunamadı');
            setLoading(false);
            return;
        }

        fetchUserData();
    }, [userId, currentUser]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            let discordData = null;
            let guildData = null;
            let firebaseData = null;

            // Discord profil verilerini çek
            if (isOwnProfile) {
                const discordResponse = await fetch('/api/auth/discord/profile');
                if (discordResponse.ok) {
                    discordData = await discordResponse.json();
                }

                // Discord guild verilerini çek (seviye ve izinler için)
                const guildResponse = await fetch('/api/auth/discord/guild');
                if (guildResponse.ok) {
                    guildData = await guildResponse.json();
                }
            }

            // Firebase'den kullanıcı verilerini çek
            try {
                const firebaseResponse = await fetch(`/api/users?id=${userId}`);
                if (firebaseResponse.ok) {
                    firebaseData = await firebaseResponse.json();
                }
            } catch (error) {
                console.log('Firebase verisi alınamadı, mock veri kullanılacak');
            }

            // Eğer veri bulunamazsa ve bu kişinin kendi profili değilse mock veri kullan
            if (!discordData && !firebaseData && !isOwnProfile) {
                const mockData: UserData = {
                    id: userId,
                    username: 'user' + userId.slice(-4),
                    displayName: 'Discord Kullanıcısı',
                    avatar: `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`,
                    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=480&fit=crop',
                    joinedAt: '2022-02-13T17:34:35.886000+00:00',
                    lastSeen: new Date().toISOString(),
                    isOnline: Math.random() > 0.5,
                    level: Math.floor(Math.random() * 50) + 1,
                    xp: Math.floor(Math.random() * 15000) + 5000,
                    nextLevelXp: 18000,
                    progress: Math.random() * 100,
                    roles: ['Üye', 'Gamer'],
                    permissions: [],
                    highestRole: 'Üye',
                    status: 'Discord kullanıcısı',
                    location: 'Bilinmiyor',
                    bio: 'Bu kullanıcı hakkında bilgi yok.',
                    stats: {
                        totalPlaytime: Math.floor(Math.random() * 1000) + 100 + ' saat',
                        gamesOwned: Math.floor(Math.random() * 100) + 50,
                        achievements: Math.floor(Math.random() * 500) + 100,
                        friends: Math.floor(Math.random() * 100) + 20,
                        screenshots: Math.floor(Math.random() * 50) + 10,
                        reviews: Math.floor(Math.random() * 20) + 5
                    },
                    badges: [
                        { name: 'Discord Kullanıcısı', icon: '💬', description: 'Discord\'da aktif kullanıcı', type: 'special' },
                        { name: 'Gamer', icon: '🎮', description: 'Oyun sevenler topluluğu', type: 'achievement' }
                    ]
                };
                setUserData(mockData);
                setLoading(false);
                return;
            }

            // Veriyi birleştir
            const profile = discordData?.profile || firebaseData || {};
            const guildMember = guildData?.member || {};
            const levelData = guildMember?.levelData || {};

            // Achievement ve special badge'leri oluştur (permission badge'leri kaldırdık)
            const achievementBadges = [
                { name: 'Early Supporter', icon: '🌟', description: 'Topluluğun ilk üyelerinden', type: 'achievement' as const },
                { name: 'Game Master', icon: '🏆', description: '100+ oyun tamamladı', type: 'achievement' as const },
                { name: 'Social Butterfly', icon: '🦋', description: '50+ arkadaş edinedi', type: 'achievement' as const },
                { name: 'Screenshot Artist', icon: '📸', description: '50+ ekran görüntüsü paylaştı', type: 'achievement' as const }
            ];

            const specialBadges = [
                { name: 'Discord Kullanıcısı', icon: '💬', description: 'Discord\'da aktif kullanıcı', type: 'special' as const }
            ];

            const combinedUserData: UserData = {
                id: profile.id || userId,
                username: profile.username || firebaseData?.username || 'user' + userId.slice(-4),
                displayName: profile.globalName || profile.username || firebaseData?.username || 'Discord Kullanıcısı',
                avatar: profile.avatar || `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`,
                banner: profile.banner || firebaseData?.banner || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=480&fit=crop',
                joinedAt: guildMember?.joinedAt || firebaseData?.joinedAt || new Date().toISOString(),
                lastSeen: firebaseData?.lastSeen || new Date().toISOString(),
                isOnline: firebaseData?.isOnline ?? true,
                level: levelData?.level || Math.floor(Math.random() * 50) + 1,
                xp: levelData?.xp || Math.floor(Math.random() * 15000) + 5000,
                nextLevelXp: levelData?.nextLevelXp || 18000,
                progress: levelData?.progress || Math.random() * 100,
                roles: guildMember?.roles?.map((r: any) => r.name) || firebaseData?.roles || ['Üye'],
                permissions: guildMember?.permissions || firebaseData?.permissions || [],
                highestRole: guildMember?.roles?.[0]?.name || 'Üye',
                status: firebaseData?.status || 'Aktif kullanıcı',
                location: firebaseData?.location || 'Bilinmiyor',
                bio: firebaseData?.bio || 'Bu kullanıcı hakkında henüz bilgi eklenmemiş.',
                stats: {
                    totalPlaytime: firebaseData?.stats?.totalPlaytime || Math.floor(Math.random() * 1000) + 100 + ' saat',
                    gamesOwned: firebaseData?.stats?.gamesOwned || Math.floor(Math.random() * 100) + 50,
                    achievements: firebaseData?.stats?.achievements || Math.floor(Math.random() * 500) + 100,
                    friends: firebaseData?.stats?.friends || Math.floor(Math.random() * 100) + 20,
                    screenshots: firebaseData?.stats?.screenshots || Math.floor(Math.random() * 50) + 10,
                    reviews: firebaseData?.stats?.reviews || Math.floor(Math.random() * 20) + 5
                },
                badges: [...achievementBadges, ...specialBadges],
                guildData: guildData
            };

            setUserData(combinedUserData);
        } catch (error) {
            console.error('Profil verisi yüklenirken hata:', error);
            setError('Profil bilgileri yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSave = (updatedData: any) => {
        if (userData) {
            setUserData({
                ...userData,
                ...updatedData
            });
        }
        // Optionally refresh data from server
        fetchUserData();
    };

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (error) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1e1f24] via-[#2a2d31] to-[#36393f] flex items-center justify-center">
                    <div className="bg-[#2f3136] rounded-xl border border-red-500/20 p-8 text-center max-w-md">
                        <div className="text-red-400 text-6xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Hata</h2>
                        <p className="text-gray-400 mb-4">{error}</p>
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-3 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors duration-300 font-medium"
                        >
                            Geri Dön
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!userData) {
        notFound();
    }

    return (
        <Layout>
            <ProfileProvider userId={userId}>
                <div className="min-h-screen bg-gradient-to-br from-[#1e1f24] via-[#2a2d31] to-[#36393f]">
                {/* Profile Header */}
                <ProfileHeader
                    user={userData}
                    isOwnProfile={isOwnProfile}
                    onEditClick={() => setIsEditModalOpen(true)}
                />

                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="xl:col-span-2 space-y-8">
                            {/* Profile Summary */}
                            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Profil Bilgileri</h2>
                                        <p className="text-gray-400">Kullanıcı hakkında genel bilgiler</p>
                                    </div>
                                    {!isOwnProfile && (
                                        <button className="px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors duration-300">
                                            Arkadaş Ekle
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">İstatistikler</h3>
                                        <div className="space-y-3">
                                            {Object.entries(userData.stats).map(([key, value]) => (
                                                <div key={key} className="flex justify-between items-center py-2 border-b border-white/5">
                                                    <span className="text-gray-400 capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                                    </span>
                                                    <span className="text-white font-medium">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-4">Discord İzinleri & Rozetler</h3>
                                        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                                            {userData.badges.map((badge, index) => (
                                                <div
                                                    key={badge.id || index}
                                                    className={`group p-3 rounded-lg border transition-all duration-300 cursor-pointer relative overflow-hidden ${badge.type === 'permission'
                                                        ? `${badge.color || 'bg-red-500'}/10 border-current text-white hover:scale-105`
                                                        : badge.type === 'achievement'
                                                            ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-400/50 text-yellow-400'
                                                            : 'bg-[#36393f] border-white/10 hover:border-[#5865f2]/50 text-white'
                                                        }`}
                                                    title={badge.description}
                                                >
                                                    {badge.type === 'permission' && (
                                                        <div className={`absolute inset-0 ${badge.color || 'bg-red-500'}/5 rounded-lg`}></div>
                                                    )}
                                                    <div className="relative flex items-center space-x-3">
                                                        <div className="text-2xl flex-shrink-0">{badge.icon}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm truncate">
                                                                {badge.name}
                                                            </div>
                                                            <div className="text-xs opacity-75 mt-1">
                                                                {badge.type === 'permission' ? '🔐 Discord İzni' :
                                                                    badge.type === 'achievement' ? '🏆 Başarım' : '✨ Özel'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Games Section */}
                            <ProfileGames userId={userData.id} />

                            {/* Activity Feed */}
                            <ProfileActivity userId={userData.id} />
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Level Progress */}
                            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Sunucu Seviyesi</h3>
                                <div className="text-center mb-4">
                                    <div className="text-3xl font-bold text-[#5865f2] mb-1">{userData.level}</div>
                                    <div className="text-gray-400">Seviye</div>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                                        <span>{userData.xp.toLocaleString()} XP</span>
                                        <span>{userData.nextLevelXp.toLocaleString()} XP</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-[#5865f2] to-[#3c82f6] h-3 rounded-full transition-all duration-300 relative overflow-hidden"
                                            style={{ width: `${Math.min(userData.progress, 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center text-sm text-gray-400">
                                    {(userData.nextLevelXp - userData.xp).toLocaleString()} XP kaldı
                                </div>
                                <div className="mt-3 text-xs text-gray-500 text-center">
                                    Seviye hesaplaması sunucudaki aktiflik süresine dayalıdır
                                </div>
                            </div>

                            {/* Discord Friends */}
                            <ProfileFriends userId={userData.id} />

                            {/* Comments Section */}
                            <ProfileComments userId={userData.id} />
                        </div>
                    </div>
                </div>

                {/* Profile Edit Modal */}
                <ProfileEdit
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    userData={userData}
                    onSave={handleProfileSave}
                />
                </div>
            </ProfileProvider>
        </Layout>
    );
} 