import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface DiscordActivity {
    id: string;
    name: string;
    type: number; // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 4: Custom, 5: Competing
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
    party?: {
        id?: string;
        size?: [number, number];
    };
    application_id?: string;
    session_id?: string;
}

interface DiscordPresence {
    user: {
        id: string;
        username: string;
        avatar: string | null;
        discriminator: string;
    };
    guild_id?: string;
    status: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';
    activities: DiscordActivity[];
    client_status: {
        desktop?: string;
        mobile?: string;
        web?: string;
    };
}

export async function GET(request: NextRequest) {
    try {
        console.log('🎮 [Discord Activities API] Request received');
        const session = await getServerSession(authOptions);

        if (!session || !session.accessToken) {
            console.log('❌ [Discord Activities API] Unauthorized - no session or access token');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // NOT: Discord activities.read scope'u gerekiyor
        // Bu endpoint kullanıcının kendi aktivitelerini döner
        console.log('🔍 [Discord Activities API] Fetching user activities');
        
        try {
            // Discord'un current user endpoint'i presence bilgisi içerebilir
            const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!userResponse.ok) {
                throw new Error(`Discord user API error: ${userResponse.status}`);
            }

            const userData = await userResponse.json();
            console.log('✅ [Discord Activities API] User data fetched');

            // Discord Gateway connection'ı olmadığı için real-time activities alamayız
            // Bunun yerine recent gaming activities'i simulate edelim
            const mockActivities = [
                {
                    id: 'act_' + Date.now(),
                    type: 'game_played',
                    title: 'Counter-Strike 2 oynadı',
                    description: '2 saat 15 dakika oynadı, 3 maç kazandı',
                    timestamp: Date.now() - (1000 * 60 * 30), // 30 dakika önce
                    platform: 'steam',
                    icon: '🎮',
                    metadata: {
                        game: 'Counter-Strike 2',
                        playtime: '2h 15m',
                        matches_won: 3,
                        kills: 45,
                        deaths: 32
                    }
                },
                {
                    id: 'act_' + (Date.now() - 1),
                    type: 'achievement',
                    title: 'Yeni başarım kazandı',
                    description: 'Valorant\'ta "Ace Master" başarımını kazandı',
                    timestamp: Date.now() - (1000 * 60 * 60 * 2), // 2 saat önce
                    platform: 'riot',
                    icon: '🏆',
                    metadata: {
                        achievement: 'Ace Master',
                        game: 'Valorant',
                        points: 50
                    }
                },
                {
                    id: 'act_' + (Date.now() - 2),
                    type: 'status_update',
                    title: 'Discord durumunu güncelledi',
                    description: 'Özel durum: "Rankl maça çıkıyorum! 🎯"',
                    timestamp: Date.now() - (1000 * 60 * 60 * 4), // 4 saat önce
                    platform: 'discord',
                    icon: '💬',
                    metadata: {
                        status: 'Rankl maça çıkıyorum! 🎯',
                        type: 'custom'
                    }
                },
                {
                    id: 'act_' + (Date.now() - 3),
                    type: 'friend_added',
                    title: 'Yeni arkadaş ekledi',
                    description: 'ProGamer2024 ile arkadaş oldu',
                    timestamp: Date.now() - (1000 * 60 * 60 * 6), // 6 saat önce
                    platform: 'discord',
                    icon: '👥',
                    metadata: {
                        friend_name: 'ProGamer2024',
                        mutual_servers: 3
                    }
                }
            ];

            return NextResponse.json({
                activities: mockActivities,
                total: mockActivities.length,
                lastFetch: new Date().toISOString(),
                source: 'simulated',
                note: 'Discord Gateway connection gerektiği için real-time activities simulate edildi',
                user: {
                    id: userData.id,
                    username: userData.username,
                    status: 'online' // Mock status
                }
            });

        } catch (fetchError) {
            console.error('💥 [Discord Activities API] Fetch error:', fetchError);
            
            return NextResponse.json({
                activities: [],
                total: 0,
                lastFetch: new Date().toISOString(),
                source: 'error',
                error: 'api_error',
                message: 'Discord aktivite verisi alınamadı',
                details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            });
        }

    } catch (error) {
        console.error('💥 [Discord Activities API] General error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}