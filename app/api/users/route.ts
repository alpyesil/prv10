import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserById, setUserData, updateUserLastSeen, adminDatabase } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        console.log('👤 [Users API] GET Request received');
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Users API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const checkUserId = searchParams.get('checkUserId');

        if (checkUserId) {
            console.log('🔍 [Users API] Checking if user exists:', checkUserId);

            try {
                const userData = await getUserById(checkUserId);
                const isRegistered = userData && userData.isRegistered === true;

                console.log('✅ [Users API] User check result:', { checkUserId, isRegistered, hasData: !!userData });

                return NextResponse.json({
                    userId: checkUserId,
                    isRegistered,
                    userData: isRegistered ? {
                        discordId: userData.discordId,
                        username: userData.username,
                        displayName: userData.displayName,
                        avatar: userData.avatar,
                        lastSeen: userData.lastSeen
                    } : null
                });
            } catch (error) {
                console.error('💥 [Users API] Error checking user:', error);
                return NextResponse.json({
                    userId: checkUserId,
                    isRegistered: false,
                    userData: null,
                    error: 'Failed to check user'
                });
            }
        }

        // Kullanıcının kendi profilini getir
        const userId = session.user.id;
        console.log('📋 [Users API] Fetching profile for user:', userId);

        try {
            const userData = await getUserById(userId);

            if (!userData) {
                console.log('❌ [Users API] User not found in database');
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Last seen güncelle
            await updateUserLastSeen(userId);

            console.log('✅ [Users API] Profile fetched successfully');
            return NextResponse.json({
                user: userData,
                lastFetch: new Date().toISOString()
            });

        } catch (error) {
            console.error('💥 [Users API] Error fetching profile:', error);
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
        }

    } catch (error) {
        console.error('💥 [Users API] General error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('👤 [Users API] POST Request received');
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Users API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('📝 [Users API] Registration data:', body);

        const { action } = body;

        if (action === 'register') {
            // Register current user
            const userData = {
                discordId: session.user.id,
                username: session.user.name || 'Unknown',
                displayName: session.user.name || 'Unknown',
                avatar: session.user.image || '',
                email: session.user.email || '',
                isRegistered: true,
                lastSeen: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            try {
                await setUserData(session.user.id, userData);
                console.log('✅ [Users API] User registered successfully:', session.user.id);

                return NextResponse.json({
                    success: true,
                    message: 'User registered successfully',
                    userData
                });
            } catch (error) {
                console.error('💥 [Users API] Registration error:', error);
                return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
            }
        }

        if (action === 'updateLastSeen') {
            // Update last seen timestamp
            try {
                await updateUserLastSeen(session.user.id);
                console.log('✅ [Users API] Last seen updated:', session.user.id);

                return NextResponse.json({ success: true });
            } catch (error) {
                console.error('💥 [Users API] Update last seen error:', error);
                return NextResponse.json({ error: 'Failed to update last seen' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('💥 [Users API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        console.log('✏️ [Users API] PUT Request received');
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Users API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, updates } = body;

        console.log('📝 [Users API] Update request:', { userId, updates });

        // Güvenlik kontrolü: Kullanıcı sadece kendi profilini güncelleyebilir
        if (userId !== session.user.id && userId !== session.user.discordId) {
            console.log('🚫 [Users API] Unauthorized profile update attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        try {
            // Mevcut kullanıcı verilerini al
            const currentUserData = await getUserById(session.user.id);

            if (!currentUserData) {
                console.log('❌ [Users API] User not found for update');
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            // Güncelleme verilerini hazırla
            const updateData = {
                ...currentUserData,
                ...updates,
                updatedAt: { '.sv': 'timestamp' },
                lastSeen: { '.sv': 'timestamp' }
            };

            // Bio karakter sınırı kontrolü
            if (updateData.bio && updateData.bio.length > 500) {
                return NextResponse.json({
                    error: 'Bio 500 karakterden fazla olamaz'
                }, { status: 400 });
            }

            // Güvenlik: Hassas alanları koruyun
            delete updateData.discordId;
            delete updateData.id;
            delete updateData.roles;
            delete updateData.permissions;

            // Firebase'e güncellemeyi kaydet
            const userRef = adminDatabase.ref(`users/${session.user.id}`);
            await userRef.update(updateData);

            console.log('✅ [Users API] Profile updated successfully');
            return NextResponse.json({
                success: true,
                message: 'Profil başarıyla güncellendi',
                updatedAt: new Date().toISOString()
            });

        } catch (error) {
            console.error('💥 [Users API] Error updating profile:', error);
            return NextResponse.json({
                error: 'Profil güncellenirken hata oluştu'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('💥 [Users API] General PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 