import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface DiscordRelationship {
    id: string;
    type: number; // 1 = friend, 2 = blocked, 3 = incoming friend request, 4 = outgoing friend request
    nickname: string | null;
    user: {
        id: string;
        username: string;
        global_name: string | null;
        avatar: string | null;
        discriminator: string;
        public_flags: number;
    };
}

export async function GET(request: NextRequest) {
    try {
        console.log('👥 [Real Friends API] Request received');
        const session = await getServerSession(authOptions);

        if (!session || !session.accessToken) {
            console.log('❌ [Real Friends API] Unauthorized - no session or access token');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // NOT: Discord relationships.read scope'u gerekiyor ve çok kısıtlı
        // Bu endpoint büyük ihtimalle 403 dönecek çünkü relationships.read scope'u yok
        console.log('🔍 [Real Friends API] Attempting to fetch real Discord friends');
        
        try {
            const friendsResponse = await fetch('https://discord.com/api/v10/users/@me/relationships', {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`,
                    'Content-Type': 'application/json',
                }
            });

            console.log('📡 [Real Friends API] Discord response status:', friendsResponse.status);

            if (friendsResponse.ok) {
                const relationships: DiscordRelationship[] = await friendsResponse.json();
                
                // Sadece gerçek arkadaşları filtrele (type: 1)
                const realFriends = relationships.filter(rel => rel.type === 1);
                
                console.log('✅ [Real Friends API] Real friends found:', realFriends.length);
                
                const processedFriends = realFriends.map(rel => ({
                    id: rel.user.id,
                    username: rel.user.username,
                    displayName: rel.user.global_name || rel.user.username,
                    discriminator: rel.user.discriminator,
                    avatar: rel.user.avatar 
                        ? `https://cdn.discordapp.com/avatars/${rel.user.id}/${rel.user.avatar}.${rel.user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
                        : `https://cdn.discordapp.com/embed/avatars/${parseInt(rel.user.discriminator) % 5}.png`,
                    nickname: rel.nickname,
                    publicFlags: rel.user.public_flags,
                    isOnline: false, // Discord arkadaş API'si presence bilgisi vermiyor
                    source: 'discord_relationships'
                }));

                return NextResponse.json({
                    friends: processedFriends,
                    total: processedFriends.length,
                    lastFetch: new Date().toISOString(),
                    source: 'discord_relationships',
                    note: 'Gerçek Discord arkadaş listesi'
                });
            } else {
                console.log('⚠️ [Real Friends API] Discord API error:', friendsResponse.status);
                
                if (friendsResponse.status === 403) {
                    return NextResponse.json({
                        friends: [],
                        total: 0,
                        lastFetch: new Date().toISOString(),
                        source: 'error',
                        error: 'relationships_scope_missing',
                        message: 'Discord arkadaş listesi için relationships.read scope gerekli. Bu scope Discord tarafından çok kısıtlı olarak veriliyor.',
                        suggestion: 'Sunucu üyelerini arkadaş olarak gösteren mevcut sistem kullanılabilir.'
                    });
                }

                throw new Error(`Discord API error: ${friendsResponse.status}`);
            }
        } catch (fetchError) {
            console.error('💥 [Real Friends API] Fetch error:', fetchError);
            
            return NextResponse.json({
                friends: [],
                total: 0,
                lastFetch: new Date().toISOString(),
                source: 'error',
                error: 'api_error',
                message: 'Discord arkadaş API\'sine erişilemedi',
                details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            });
        }

    } catch (error) {
        console.error('💥 [Real Friends API] General error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}