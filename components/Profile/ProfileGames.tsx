"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProfileContext } from '@/components/providers/ProfileContext';

interface GamePlatform {
    type: string;
    name: string;
    id: string;
    icon: string;
    color: string;
    verified: boolean;
    showActivity: boolean;
}

interface GameData {
    id: string;
    name: string;
    image?: string;
    playtime?: string;
    lastPlayed?: string;
    achievements?: number;
    platform: string;
    status?: 'playing' | 'recently_played' | 'installed';
}

interface ProfileGamesProps {
    userId: string;
}

export default function ProfileGames({ userId }: ProfileGamesProps) {
    const { discordProfile, loading } = useProfileContext();
    const [games, setGames] = useState<GameData[]>([]);
    const [platforms, setPlatforms] = useState<GamePlatform[]>([]);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Gaming platform mappings
    const platformMap: Record<string, { icon: string; color: string; displayName: string }> = {
        steam: {
            icon: '🎮',
            color: 'from-blue-600 to-blue-800',
            displayName: 'Steam'
        },
        xbox: {
            icon: '🎯',
            color: 'from-green-600 to-green-800',
            displayName: 'Xbox Live'
        },
        playstation: {
            icon: '🎮',
            color: 'from-blue-500 to-blue-700',
            displayName: 'PlayStation Network'
        },
        riotgames: {
            icon: '⚔️',
            color: 'from-red-600 to-red-800',
            displayName: 'Riot Games'
        },
        leagueoflegends: {
            icon: '🏆',
            color: 'from-yellow-600 to-yellow-800',
            displayName: 'League of Legends'
        },
        epicgames: {
            icon: '🚀',
            color: 'from-purple-600 to-purple-800',
            displayName: 'Epic Games'
        },
        battlenet: {
            icon: '⚡',
            color: 'from-blue-400 to-blue-600',
            displayName: 'Battle.net'
        },
        origin: {
            icon: '🎪',
            color: 'from-orange-600 to-orange-800',
            displayName: 'EA Origin'
        }
    };

    // Process Discord connections to get gaming platforms
    useEffect(() => {
        if (discordProfile?.connections) {
            const gamingConnections = discordProfile.connections
                .filter(conn => Object.keys(platformMap).includes(conn.type.toLowerCase()))
                .map(conn => ({
                    type: conn.type.toLowerCase(),
                    name: conn.name,
                    id: conn.id,
                    icon: platformMap[conn.type.toLowerCase()]?.icon || '🎮',
                    color: platformMap[conn.type.toLowerCase()]?.color || 'from-gray-600 to-gray-800',
                    verified: conn.verified,
                    showActivity: conn.showActivity
                }));

            setPlatforms(gamingConnections);
            console.log('🎮 [ProfileGames] Gaming platforms found:', gamingConnections);
        }
    }, [discordProfile]);

    // Process gaming data from Discord API
    useEffect(() => {
        if (platforms.length > 0 && discordProfile?.gaming) {
            const gamesList: GameData[] = [];
            const gamingData = discordProfile.gaming;

            platforms.forEach(platform => {
                switch (platform.type) {
                    case 'steam':
                        if (gamingData.steam?.recentGames) {
                            gamingData.steam.recentGames.forEach((game: any) => {
                                const playtimeHours = Math.floor(game.playtimeForever / 60);
                                const recentPlaytime = game.playtime2weeks || 0;

                                gamesList.push({
                                    id: `steam_${game.appId}`,
                                    name: game.name,
                                    image: game.imgIconUrl || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/header.jpg`,
                                    playtime: `${playtimeHours.toLocaleString()} saat`,
                                    lastPlayed: recentPlaytime > 0 ? `${Math.floor(recentPlaytime / 60)} saat (son 2 hafta)` : 'Uzun zaman önce',
                                    platform: 'steam',
                                    status: gamingData.steam.currentGame === game.name ? 'playing' :
                                        recentPlaytime > 0 ? 'recently_played' : 'installed'
                                });
                            });
                        }
                        break;

                    case 'riotgames':
                    case 'leagueoflegends':
                        if (gamingData.riot?.games) {
                            gamingData.riot.games.forEach((gameInfo: any) => {
                                gamesList.push({
                                    id: `riot_${gameInfo.game.toLowerCase().replace(/\s+/g, '_')}`,
                                    name: gameInfo.game,
                                    image: gameInfo.game === 'League of Legends' ?
                                        'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg' :
                                        'https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt34a43e75ad7f4e40/5eb26f0c8c5fd90c1b12e9b8/V_AGENTS_587x316_Jett.jpg',
                                    playtime: gameInfo.hours ? `${gameInfo.hours} saat` :
                                        gameInfo.championLevel ? `Seviye ${gameInfo.championLevel}` : 'Bilinmiyor',
                                    lastPlayed: `${gameInfo.rank || 'Unranked'} • ${gameInfo.winRate || 'N/A'} kazanma`,
                                    platform: 'riotgames',
                                    status: 'recently_played'
                                });
                            });
                        }
                        break;

                    case 'xbox':
                        if (gamingData.xbox?.recentGames) {
                            gamingData.xbox.recentGames.forEach((game: any) => {
                                gamesList.push({
                                    id: `xbox_${game.name.toLowerCase().replace(/\s+/g, '_')}`,
                                    name: game.name,
                                    image: `https://store-images.s-microsoft.com/image/apps.50582.14506490610164231.0bd63c92-d167-4d7b-b882-90bf5b4e8c09.b78eb0bb-c6c6-4e54-b9f6-b07d21c4cca4`,
                                    playtime: `${game.gamerscore} Gamerscore`,
                                    lastPlayed: new Date(game.lastPlayed).toLocaleDateString('tr-TR'),
                                    achievements: game.achievement,
                                    platform: 'xbox',
                                    status: 'recently_played'
                                });
                            });
                        }
                        break;

                    case 'playstation':
                        if (gamingData.playstation?.recentGames) {
                            gamingData.playstation.recentGames.forEach((game: any) => {
                                gamesList.push({
                                    id: `playstation_${game.name.toLowerCase().replace(/\s+/g, '_')}`,
                                    name: game.name,
                                    image: 'https://image.api.playstation.com/vulcan/img/rnd/202010/2217/xnE4M8NpAMfGnNELdwcDOPFh.png',
                                    playtime: `${game.progress} tamamlandı`,
                                    lastPlayed: new Date(game.lastPlayed).toLocaleDateString('tr-TR'),
                                    achievements: game.trophies,
                                    platform: 'playstation',
                                    status: 'recently_played'
                                });
                            });
                        }
                        break;

                    case 'epicgames':
                        if (gamingData.epic?.recentGames) {
                            gamingData.epic.recentGames.forEach((game: any) => {
                                gamesList.push({
                                    id: `epic_${game.name.toLowerCase().replace(/\s+/g, '_')}`,
                                    name: game.name,
                                    playtime: game.hours ? `${game.hours} saat` :
                                        game.wins ? `${game.wins} galibiyet` : 'Bilinmiyor',
                                    lastPlayed: game.rank || game.kills ?
                                        `${game.rank || ''} ${game.kills ? `• ${game.kills} kill` : ''}`.trim() :
                                        'Son aktivite',
                                    platform: 'epicgames',
                                    status: 'recently_played'
                                });
                            });
                        }
                        break;

                    case 'battlenet':
                        if (gamingData.battlenet?.recentGames) {
                            gamingData.battlenet.recentGames.forEach((game: any) => {
                                gamesList.push({
                                    id: `battlenet_${game.name.toLowerCase().replace(/\s+/g, '_')}`,
                                    name: game.name,
                                    playtime: game.level ? `Seviye ${game.level}` :
                                        game.sr ? `${game.sr} SR` : 'Bilinmiyor',
                                    lastPlayed: game.rank || game.class || game.mainHero || 'Oyuncu',
                                    platform: 'battlenet',
                                    status: 'recently_played'
                                });
                            });
                        }
                        break;
                }
            });

            setGames(gamesList);
            setIsLoading(false);
        } else if (platforms.length > 0) {
            // Fallback to mock data if no gaming data from API
            const mockGames: GameData[] = [];

            platforms.forEach(platform => {
                switch (platform.type) {
                    case 'steam':
                        mockGames.push(
                            {
                                id: 'cs2',
                                name: 'Counter-Strike 2',
                                image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg',
                                playtime: '2,547 saat',
                                lastPlayed: '2 dakika önce',
                                achievements: 164,
                                platform: 'steam',
                                status: 'playing'
                            },
                            {
                                id: 'dota2',
                                name: 'Dota 2',
                                image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570/header.jpg',
                                playtime: '1,234 saat',
                                lastPlayed: '1 hafta önce',
                                achievements: 67,
                                platform: 'steam',
                                status: 'recently_played'
                            }
                        );
                        break;
                    case 'riotgames':
                    case 'leagueoflegends':
                        mockGames.push(
                            {
                                id: 'lol',
                                name: 'League of Legends',
                                image: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Yasuo_0.jpg',
                                playtime: '3,421 saat',
                                lastPlayed: 'Gold II • 64% kazanma',
                                platform: 'riotgames',
                                status: 'recently_played'
                            }
                        );
                        break;
                    case 'xbox':
                        mockGames.push(
                            {
                                id: 'halo',
                                name: 'Halo Infinite',
                                image: 'https://store-images.s-microsoft.com/image/apps.50582.14506490610164231.0bd63c92-d167-4d7b-b882-90bf5b4e8c09.b78eb0bb-c6c6-4e54-b9f6-b07d21c4cca4',
                                playtime: '2450 Gamerscore',
                                lastPlayed: '2 gün önce',
                                achievements: 125,
                                platform: 'xbox',
                                status: 'recently_played'
                            }
                        );
                        break;
                    case 'playstation':
                        mockGames.push(
                            {
                                id: 'gow',
                                name: 'God of War',
                                image: 'https://image.api.playstation.com/vulcan/img/rnd/202010/2217/xnE4M8NpAMfGnNELdwcDOPFh.png',
                                playtime: '87% tamamlandı',
                                lastPlayed: '1 hafta önce',
                                achievements: 34,
                                platform: 'playstation',
                                status: 'recently_played'
                            }
                        );
                        break;
                }
            });

            setGames(mockGames);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [platforms, discordProfile]);

    const filteredGames = activeTab === 'all'
        ? games
        : games.filter(game => game.platform === activeTab);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'playing':
                return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Oynuyor</span>;
            case 'recently_played':
                return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Son Oynanan</span>;
            case 'installed':
                return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">Kurulu</span>;
            default:
                return null;
        }
    };

    if (loading || isLoading) {
        return (
            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-600 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-gray-600 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Oyun Kütüphanesi</h2>
                    <p className="text-gray-400">Discord bağlantıları üzerinden alınan oyun verileri</p>
                </div>
                <div className="text-sm text-gray-400">
                    {games.length} oyun • {platforms.length} platform
                </div>
            </div>

            {/* Platform Tabs */}
            {platforms.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'all'
                            ? 'bg-[#5865f2] text-white'
                            : 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]'
                            }`}
                    >
                        Tümü ({games.length})
                    </button>
                    {platforms.map(platform => (
                        <button
                            key={platform.type}
                            onClick={() => setActiveTab(platform.type)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === platform.type
                                ? `bg-gradient-to-r ${platform.color} text-white`
                                : 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]'
                                }`}
                        >
                            <span>{platform.icon}</span>
                            <span>{platformMap[platform.type]?.displayName || platform.type}</span>
                            <span className="text-xs">({games.filter(g => g.platform === platform.type).length})</span>
                            {platform.verified && <span className="text-green-400">✓</span>}
                        </button>
                    ))}
                </div>
            )}

            {/* Games Grid */}
            {filteredGames.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredGames.map(game => (
                        <div
                            key={game.id}
                            className="group bg-[#36393f] rounded-lg border border-white/10 overflow-hidden hover:border-[#5865f2]/50 transition-all duration-300"
                        >
                            <div className="flex">
                                {/* Game Image */}
                                <div className="w-24 h-20 relative bg-gray-700 flex-shrink-0">
                                    {game.image ? (
                                        <Image
                                            src={game.image}
                                            alt={game.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold">
                                            {game.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Game Info */}
                                <div className="flex-1 p-3">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-semibold text-white group-hover:text-[#5865f2] transition-colors duration-300 truncate">
                                            {game.name}
                                        </h3>
                                        {getStatusBadge(game.status || '')}
                                    </div>

                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-xs text-[#5865f2]">
                                            {platformMap[game.platform]?.icon} {platformMap[game.platform]?.displayName || game.platform}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-xs text-gray-400">
                                        {game.playtime && (
                                            <div className="flex justify-between">
                                                <span>Oynanma Süresi:</span>
                                                <span className="text-white">{game.playtime}</span>
                                            </div>
                                        )}
                                        {game.lastPlayed && (
                                            <div className="flex justify-between">
                                                <span>Son Oynanma:</span>
                                                <span className="text-white">{game.lastPlayed}</span>
                                            </div>
                                        )}
                                        {game.achievements && (
                                            <div className="flex justify-between">
                                                <span>Başarımlar:</span>
                                                <span className="text-white">{game.achievements}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : platforms.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎮</div>
                    <h3 className="text-xl font-semibold text-white mb-2">Oyun Platformu Bağlantısı Yok</h3>
                    <p className="text-gray-400 mb-6">Discord hesabınızı Steam, Xbox, PlayStation gibi oyun platformlarıyla bağlayın.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {Object.entries(platformMap).map(([key, platform]) => (
                            <div key={key} className="flex items-center space-x-2 px-4 py-2 bg-[#36393f] rounded-lg">
                                <span>{platform.icon}</span>
                                <span className="text-sm text-gray-300">{platform.displayName}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Bu Platformda Oyun Bulunamadı</h3>
                    <p className="text-gray-400">Seçili platformda kayıtlı oyun verisi bulunmuyor.</p>
                </div>
            )}

            {/* Connected Platforms Summary */}
            {platforms.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Bağlı Platformlar</h4>
                    <div className="flex flex-wrap gap-3">
                        {platforms.map(platform => (
                            <div key={platform.type} className="flex items-center space-x-2 px-3 py-2 bg-[#36393f] rounded-lg text-sm">
                                <span>{platform.icon}</span>
                                <span className="text-gray-300">{platform.name}</span>
                                {platform.verified && <span className="text-green-400 text-xs">✓ Doğrulanmış</span>}
                                {platform.showActivity && <span className="text-blue-400 text-xs">📊 Aktivite</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 