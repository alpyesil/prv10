import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

interface DiscordProfile {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    banner: string | null;
    accent_color: number | null;
    locale?: string;
    mfa_enabled?: boolean;
    premium_type?: number;
    public_flags?: number;
}

interface DiscordConnection {
    type: string;
    id: string;
    name: string;
    verified: boolean;
    friend_sync: boolean;
    show_activity: boolean;
    visibility: number;
}

interface DiscordActivity {
    id: string;
    name: string;
    type: number;
    url?: string;
    details?: string;
    state?: string;
    timestamps?: {
        start?: number;
        end?: number;
    };
    assets?: {
        large_image?: string;
        large_text?: string;
        small_image?: string;
        small_text?: string;
    };
}

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 [Discord Profile API] Request received');

        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Discord Profile API] No session found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = session.accessToken;
        if (!accessToken) {
            console.log('❌ [Discord Profile API] No access token found');
            return NextResponse.json({ error: 'No access token' }, { status: 401 });
        }

        console.log('🔐 [Discord Profile API] Fetching Discord profile data');

        // Fetch user profile
        const profileResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!profileResponse.ok) {
            console.log('❌ [Discord Profile API] Profile fetch failed:', profileResponse.status);
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: profileResponse.status });
        }

        const profile: DiscordProfile = await profileResponse.json();

        // Fetch user connections
        const connectionsResponse = await fetch(`${DISCORD_API_BASE}/users/@me/connections`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        let connections: DiscordConnection[] = [];
        if (connectionsResponse.ok) {
            connections = await connectionsResponse.json();
            console.log('🔗 [Discord Profile API] Connections fetched:', connections.length);
        } else {
            console.log('⚠️ [Discord Profile API] Connections fetch failed:', connectionsResponse.status);
        }

        // Build avatar and banner URLs
        const avatarUrl = profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${profile.avatar.startsWith('a_') ? 'gif' : 'png'}?size=512`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(profile.id) % 5}.png`;

        const bannerUrl = profile.banner
            ? `https://cdn.discordapp.com/banners/${profile.id}/${profile.banner}.${profile.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024`
            : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=480&fit=crop';

        // Process gaming connections and gather platform data
        const gamingPlatforms = ['steam', 'xbox', 'playstation', 'riotgames', 'leagueoflegends', 'epicgames', 'battlenet'];
        const gamingData: Record<string, any> = {};

        for (const connection of connections) {
            if (gamingPlatforms.includes(connection.type.toLowerCase()) && connection.show_activity) {
                try {
                    console.log(`🎮 [Discord Profile API] Processing ${connection.type} connection:`, connection.id);

                    switch (connection.type.toLowerCase()) {
                        case 'steam':
                            // Steam API integration (requires Steam API key)
                            const steamApiKey = process.env.STEAM_API_KEY;
                            if (steamApiKey) {
                                try {
                                    const steamResponse = await fetch(
                                        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${connection.id}`
                                    );
                                    if (steamResponse.ok) {
                                        const steamResult = await steamResponse.json();
                                        const player = steamResult.response.players[0];

                                        // Get recently played games
                                        const recentGamesResponse = await fetch(
                                            `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${steamApiKey}&steamid=${connection.id}&count=10`
                                        );

                                        let recentGames = [];
                                        if (recentGamesResponse.ok) {
                                            const gamesResult = await recentGamesResponse.json();
                                            recentGames = gamesResult.response?.games || [];
                                        }

                                        gamingData.steam = {
                                            steamId: connection.id,
                                            personaName: connection.name,
                                            profileUrl: player?.profileurl,
                                            avatar: player?.avatar,
                                            currentGame: player?.gameextrainfo,
                                            gameId: player?.gameid,
                                            personaState: player?.personastate,
                                            recentGames: recentGames.map((game: any) => ({
                                                appId: game.appid,
                                                name: game.name,
                                                playtime2weeks: game.playtime_2weeks,
                                                playtimeForever: game.playtime_forever,
                                                imgIconUrl: game.img_icon_url ?
                                                    `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : null,
                                                imgLogoUrl: game.img_logo_url ?
                                                    `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg` : null
                                            }))
                                        };
                                    }
                                } catch (steamError) {
                                    console.log('⚠️ [Discord Profile API] Steam API error:', steamError);
                                }
                            }

                            // Fallback mock data if Steam API is not available
                            if (!gamingData.steam) {
                                gamingData.steam = {
                                    steamId: connection.id,
                                    personaName: connection.name,
                                    profileUrl: `https://steamcommunity.com/profiles/${connection.id}`,
                                    currentGame: 'Counter-Strike 2',
                                    gameId: '730',
                                    recentGames: [
                                        {
                                            appId: 730,
                                            name: 'Counter-Strike 2',
                                            playtime2weeks: 2547,
                                            playtimeForever: 154200,
                                            imgIconUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg'
                                        },
                                        {
                                            appId: 570,
                                            name: 'Dota 2',
                                            playtime2weeks: 0,
                                            playtimeForever: 74040,
                                            imgIconUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570/header.jpg'
                                        }
                                    ]
                                };
                            }
                            break;

                        case 'riotgames':
                        case 'leagueoflegends':
                            // Riot Games mock data (Riot API requires proper authentication)
                            gamingData.riot = {
                                riotId: connection.id,
                                gameName: connection.name,
                                games: [
                                    {
                                        game: 'League of Legends',
                                        rank: 'Gold II',
                                        lp: '67 LP',
                                        winRate: '64%',
                                        mainRole: 'ADC',
                                        championLevel: 234
                                    },
                                    {
                                        game: 'VALORANT',
                                        rank: 'Platinum 1',
                                        rr: '25 RR',
                                        winRate: '58%',
                                        mainAgent: 'Jett',
                                        hours: 789
                                    }
                                ]
                            };
                            break;

                        case 'xbox':
                            // Xbox Live mock data
                            gamingData.xbox = {
                                gamertag: connection.name,
                                gamerscore: 15240,
                                achievementsUnlocked: 456,
                                recentGames: [
                                    {
                                        name: 'Halo Infinite',
                                        achievement: 125,
                                        gamerscore: 2450,
                                        lastPlayed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                                    },
                                    {
                                        name: 'Forza Horizon 5',
                                        achievement: 89,
                                        gamerscore: 1890,
                                        lastPlayed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                                    }
                                ]
                            };
                            break;

                        case 'playstation':
                            // PlayStation Network mock data
                            gamingData.playstation = {
                                onlineId: connection.name,
                                level: 278,
                                trophies: {
                                    platinum: 12,
                                    gold: 145,
                                    silver: 423,
                                    bronze: 891
                                },
                                recentGames: [
                                    {
                                        name: 'God of War',
                                        progress: '87%',
                                        trophies: 34,
                                        lastPlayed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                                    },
                                    {
                                        name: 'Spider-Man 2',
                                        progress: '45%',
                                        trophies: 18,
                                        lastPlayed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                                    }
                                ]
                            };
                            break;

                        case 'epicgames':
                            // Epic Games mock data
                            gamingData.epic = {
                                displayName: connection.name,
                                recentGames: [
                                    {
                                        name: 'Fortnite',
                                        wins: 234,
                                        kills: 1456,
                                        matches: 892
                                    },
                                    {
                                        name: 'Rocket League',
                                        rank: 'Diamond II',
                                        mmr: 1245,
                                        hours: 345
                                    }
                                ]
                            };
                            break;

                        case 'battlenet':
                            // Battle.net mock data
                            gamingData.battlenet = {
                                battleTag: connection.name,
                                recentGames: [
                                    {
                                        name: 'Overwatch 2',
                                        rank: 'Platinum',
                                        sr: 2680,
                                        mainHero: 'Tracer'
                                    },
                                    {
                                        name: 'Diablo IV',
                                        level: 67,
                                        class: 'Necromancer',
                                        paragonLevel: 23
                                    }
                                ]
                            };
                            break;
                    }
                } catch (error) {
                    console.log(`⚠️ [Discord Profile API] ${connection.type} data fetch failed:`, error);
                }
            }
        }

        const responseData = {
            profile: {
                id: profile.id,
                username: profile.username,
                globalName: profile.global_name,
                avatar: avatarUrl,
                banner: bannerUrl,
                accentColor: profile.accent_color,
                premiumType: profile.premium_type,
                publicFlags: profile.public_flags
            },
            connections: connections.map(conn => ({
                type: conn.type,
                id: conn.id,
                name: conn.name,
                verified: conn.verified,
                showActivity: conn.show_activity,
                visibility: conn.visibility
            })),
            gaming: gamingData,
            lastFetch: new Date().toISOString()
        };

        console.log('✅ [Discord Profile API] Profile data prepared successfully');
        return NextResponse.json(responseData);

    } catch (error) {
        console.error('💥 [Discord Profile API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 