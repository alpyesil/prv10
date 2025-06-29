"use client";

import { useState } from 'react';
import { useProfileContext } from '@/components/providers/ProfileContext';
import { useSession } from 'next-auth/react';

interface Activity {
    id: string;
    type: 'game_session' | 'achievement' | 'friend_add' | 'level_up' | 'screenshot' | 'review';
    title: string;
    description: string;
    timestamp: string;
    game?: string;
    image?: string;
    metadata?: Record<string, any>;
}

interface ProfileActivityProps {
    userId: string;
}

// Mock aktivite verileri - artık gerçek Firebase verisi kullanılıyor
const mockActivities: Activity[] = [];

export default function ProfileActivity({ userId }: ProfileActivityProps) {
    const { data: session } = useSession();
    const { activities, isLoading: loading, error } = useProfileContext();
    const [filter, setFilter] = useState<'all' | Activity['type']>('all');

    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'game_session':
                return '🎮';
            case 'achievement':
                return '🏆';
            case 'level_up':
                return '⬆️';
            case 'friend_add':
                return '👥';
            case 'screenshot':
                return '📸';
            case 'review':
                return '📝';
            default:
                return '📅';
        }
    };

    const getActivityColor = (type: Activity['type']) => {
        switch (type) {
            case 'game_session':
                return 'text-green-400';
            case 'achievement':
                return 'text-yellow-400';
            case 'level_up':
                return 'text-blue-400';
            case 'friend_add':
                return 'text-purple-400';
            case 'screenshot':
                return 'text-pink-400';
            case 'review':
                return 'text-orange-400';
            default:
                return 'text-gray-400';
        }
    };

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter((activity: any) => activity.type === filter);

    const activityFilters = [
        { key: 'all', label: 'Tümü', count: activities.length },
        { key: 'game_session', label: 'Oyun Oturumları', count: activities.filter((a: any) => a.type === 'game_session').length },
        { key: 'achievement', label: 'Başarımlar', count: activities.filter((a: any) => a.type === 'achievement').length },
        { key: 'level_up', label: 'Seviye Atlamaları', count: activities.filter((a: any) => a.type === 'level_up').length },
        { key: 'screenshot', label: 'Ekran Görüntüleri', count: activities.filter((a: any) => a.type === 'screenshot').length }
    ];

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'şimdi';
        if (minutes < 60) return `${minutes} dakika önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;

        return new Date(timestamp).toLocaleDateString('tr-TR');
    };

    const handleAddTestActivity = async () => {
        console.log('🧪 [ProfileActivity] Adding test activity');
        await addActivity({
            type: 'game_session',
            title: 'Test - Counter-Strike 2 oynadı',
            description: 'Firebase test aktivitesi - 1 saat 30 dakika',
            game: 'Counter-Strike 2',
            metadata: { playtime: '1h 30m', kills: 18, deaths: 8 }
        });
    };

    if (loading) {
        return (
            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex space-x-4">
                                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                                    <div className="h-6 bg-gray-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#2f3136] rounded-xl border border-white/10">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Son Aktiviteler</h2>
                        <p className="text-gray-400">Kullanıcının son etkinlikleri ve başarımları</p>
                        {error && (
                            <div className="mt-2 text-red-400 text-sm">{error}</div>
                        )}
                    </div>

                    {/* Debug Test Button */}
                    {session?.user?.id === userId && (
                        <div>
                            <button
                                onClick={handleAddTestActivity}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm"
                            >
                                🧪 Test Aktivite Ekle
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                    {activityFilters.map((filterOption) => (
                        <button
                            key={filterOption.key}
                            onClick={() => setFilter(filterOption.key as any)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${filter === filterOption.key
                                ? 'bg-[#5865f2] text-white'
                                : 'bg-[#36393f] text-gray-400 hover:text-white hover:bg-[#404449]'
                                }`}
                        >
                            {filterOption.label} ({filterOption.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Activities Timeline */}
            <div className="p-6">
                {filteredActivities.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">📭</div>
                        <h3 className="text-lg font-medium text-white mb-2">Aktivite bulunamadı</h3>
                        <p className="text-gray-400">
                            {filter === 'all'
                                ? 'Henüz aktivite yok. Test butonu ile aktivite ekleyebilirsiniz.'
                                : 'Bu kategoride henüz aktivite yok.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredActivities.map((activity: any, index: number) => (
                            <div
                                key={activity.id}
                                className="group relative flex space-x-4 p-4 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-300"
                            >
                                {/* Timeline Line */}
                                {index < filteredActivities.length - 1 && (
                                    <div className="absolute left-8 top-16 w-0.5 h-full bg-gradient-to-b from-[#5865f2] to-transparent opacity-30"></div>
                                )}

                                {/* Activity Icon */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-[#36393f] border-2 border-white/10 flex items-center justify-center text-xl ${getActivityColor(activity.type)} group-hover:border-[#5865f2]/50 transition-all duration-300`}>
                                    {getActivityIcon(activity.type)}
                                </div>

                                {/* Activity Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-white group-hover:text-[#5865f2] transition-colors duration-300">
                                                {activity.title}
                                            </h3>
                                            <p className="text-gray-400">{activity.description}</p>
                                            {activity.game && (
                                                <div className="flex items-center space-x-1 mt-1">
                                                    <span className="text-xs text-gray-500">📍</span>
                                                    <span className="text-xs text-[#5865f2] font-medium">{activity.game}</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatTimestamp(activity.timestamp)}</span>
                                    </div>

                                    {/* Activity Metadata */}
                                    {activity.metadata && (
                                        <div className="mt-3">
                                            {activity.type === 'game_session' && (
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-gray-400">⏱️</span>
                                                        <span className="text-white">{activity.metadata.playtime}</span>
                                                    </div>
                                                    {activity.metadata.kills && (
                                                        <div className="flex items-center space-x-1">
                                                            <span className="text-green-400">💀</span>
                                                            <span className="text-white">{activity.metadata.kills} kills</span>
                                                        </div>
                                                    )}
                                                    {activity.metadata.wins && (
                                                        <div className="flex items-center space-x-1">
                                                            <span className="text-yellow-400">🏆</span>
                                                            <span className="text-white">{activity.metadata.wins} wins</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {activity.type === 'level_up' && (
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-gray-400">Seviye:</span>
                                                        <span className="text-red-400">{activity.metadata.oldLevel}</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-green-400 font-bold">{activity.metadata.newLevel}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-blue-400">⭐</span>
                                                        <span className="text-white">+{activity.metadata.xpGained} XP</span>
                                                    </div>
                                                </div>
                                            )}

                                            {activity.type === 'achievement' && activity.metadata?.rarity && (
                                                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                                    ⭐ {activity.metadata.rarity === 'rare' ? 'Nadir' : 'Epic'} Başarım
                                                </div>
                                            )}

                                            {activity.type === 'review' && activity.metadata && (
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <span
                                                                key={i}
                                                                className={i < activity.metadata!.rating ? 'text-yellow-400' : 'text-gray-600'}
                                                            >
                                                                ⭐
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-gray-400">"{activity.metadata.reviewText}"</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Activity Image */}
                                    {activity.image && (
                                        <div className="mt-3">
                                            <img
                                                src={activity.image}
                                                alt={activity.title}
                                                className="w-full max-w-sm h-32 object-cover rounded-lg border border-white/10"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More */}
                {filteredActivities.length > 0 && (
                    <div className="text-center mt-8">
                        <button className="px-6 py-3 bg-[#36393f] text-gray-300 rounded-lg hover:bg-[#404449] hover:text-white transition-all duration-300 border border-white/10">
                            Daha Fazla Aktivite Yükle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 