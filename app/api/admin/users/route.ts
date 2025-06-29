import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { database } from '@/lib/firebase-rest';

export async function GET(request: NextRequest) {
    try {
        console.log('👥 [Admin Users API] GET request received');
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin permissions
        const userRoles = session.user.roles || [];
        const isAdmin = userRoles.some(role => 
            ['admin', 'super_admin', 'moderator'].includes(role.toLowerCase())
        );

        if (!isAdmin) {
            return NextResponse.json({ 
                error: 'Forbidden', 
                message: 'Admin/Moderator yetkisi gereklidir' 
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';
        const status = searchParams.get('status') || '';
        const sortBy = searchParams.get('sortBy') || 'joinedAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Get all users
        const usersRef = await database.ref('users');
        const snapshot = await usersRef.get();
        const usersData = snapshot.val() || {};
        let users = Object.values(usersData) as any[];

        // Apply filters
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(user =>
                user.username?.toLowerCase().includes(searchLower) ||
                user.displayName?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower) ||
                user.discordId?.includes(search)
            );
        }

        if (role) {
            users = users.filter(user =>
                user.roles?.some((userRole: string) => userRole.toLowerCase() === role.toLowerCase())
            );
        }

        if (status) {
            if (status === 'online') {
                users = users.filter(user => user.isOnline && user.status !== 'offline');
            } else if (status === 'offline') {
                users = users.filter(user => !user.isOnline || user.status === 'offline');
            } else {
                users = users.filter(user => user.status === status);
            }
        }

        // Sort users
        users.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
                case 'username':
                    aValue = a.username || '';
                    bValue = b.username || '';
                    break;
                case 'level':
                    aValue = a.level || 0;
                    bValue = b.level || 0;
                    break;
                case 'lastSeen':
                    aValue = a.lastSeen || 0;
                    bValue = b.lastSeen || 0;
                    break;
                case 'messages':
                    aValue = a.stats?.messagesCount || 0;
                    bValue = b.stats?.messagesCount || 0;
                    break;
                case 'joinedAt':
                default:
                    aValue = a.joinedAt || 0;
                    bValue = b.joinedAt || 0;
                    break;
            }

            if (typeof aValue === 'string') {
                return sortOrder === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                return sortOrder === 'asc' 
                    ? aValue - bValue
                    : bValue - aValue;
            }
        });

        // Pagination
        const totalCount = users.length;
        const totalPages = Math.ceil(totalCount / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = users.slice(startIndex, endIndex);

        console.log(`✅ [Admin Users API] Returning ${paginatedUsers.length} users (page ${page}/${totalPages})`);

        return NextResponse.json({
            users: paginatedUsers,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            filters: {
                search,
                role,
                status,
                sortBy,
                sortOrder
            }
        });

    } catch (error) {
        console.error('💥 [Admin Users API] GET Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        console.log('👥 [Admin Users API] PUT request received');
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin permissions
        const userRoles = session.user.roles || [];
        const isAdmin = userRoles.some(role => 
            ['admin', 'super_admin'].includes(role.toLowerCase())
        );

        if (!isAdmin) {
            return NextResponse.json({ 
                error: 'Forbidden', 
                message: 'Admin yetkisi gereklidir' 
            }, { status: 403 });
        }

        const body = await request.json();
        const { userId, action, data } = body;

        if (!userId || !action) {
            return NextResponse.json({ 
                error: 'Bad Request', 
                message: 'userId ve action parametreleri gereklidir' 
            }, { status: 400 });
        }

        const userRef = database.ref(`users/${userId}`);
        const userSnapshot = await userRef.get();

        if (!userSnapshot.exists()) {
            return NextResponse.json({ 
                error: 'Not Found', 
                message: 'Kullanıcı bulunamadı' 
            }, { status: 404 });
        }

        const userData = userSnapshot.val();

        switch (action) {
            case 'updateRoles':
                if (!data.roles || !Array.isArray(data.roles)) {
                    return NextResponse.json({ 
                        error: 'Bad Request', 
                        message: 'Geçerli roller gereklidir' 
                    }, { status: 400 });
                }

                await userRef.update({
                    roles: data.roles,
                    updatedAt: { '.sv': 'timestamp' },
                    updatedBy: session.user.id
                });

                console.log(`✅ [Admin Users API] Updated roles for user ${userId}`);
                break;

            case 'updatePermissions':
                if (!data.permissions || !Array.isArray(data.permissions)) {
                    return NextResponse.json({ 
                        error: 'Bad Request', 
                        message: 'Geçerli izinler gereklidir' 
                    }, { status: 400 });
                }

                await userRef.update({
                    permissions: data.permissions,
                    updatedAt: { '.sv': 'timestamp' },
                    updatedBy: session.user.id
                });

                console.log(`✅ [Admin Users API] Updated permissions for user ${userId}`);
                break;

            case 'ban':
                const banReason = data.reason || 'Sebep belirtilmedi';
                const banDuration = data.duration || null; // null = permanent

                await userRef.update({
                    isBanned: true,
                    banReason,
                    banDuration,
                    bannedAt: { '.sv': 'timestamp' },
                    bannedBy: session.user.id,
                    updatedAt: { '.sv': 'timestamp' }
                });

                console.log(`✅ [Admin Users API] Banned user ${userId} - Reason: ${banReason}`);
                break;

            case 'unban':
                await userRef.update({
                    isBanned: false,
                    banReason: null,
                    banDuration: null,
                    bannedAt: null,
                    bannedBy: null,
                    unbannedAt: { '.sv': 'timestamp' },
                    unbannedBy: session.user.id,
                    updatedAt: { '.sv': 'timestamp' }
                });

                console.log(`✅ [Admin Users API] Unbanned user ${userId}`);
                break;

            case 'updateLevel':
                const newLevel = parseInt(data.level);
                const newXp = parseInt(data.xp);

                if (isNaN(newLevel) || isNaN(newXp)) {
                    return NextResponse.json({ 
                        error: 'Bad Request', 
                        message: 'Geçerli level ve XP değerleri gereklidir' 
                    }, { status: 400 });
                }

                await userRef.update({
                    level: newLevel,
                    xp: newXp,
                    updatedAt: { '.sv': 'timestamp' },
                    updatedBy: session.user.id
                });

                console.log(`✅ [Admin Users API] Updated level for user ${userId} to ${newLevel} (${newXp} XP)`);
                break;

            case 'addBadge':
                const badge = data.badge;
                if (!badge) {
                    return NextResponse.json({ 
                        error: 'Bad Request', 
                        message: 'Badge gereklidir' 
                    }, { status: 400 });
                }

                const currentBadges = userData.badges || [];
                if (!currentBadges.includes(badge)) {
                    await userRef.update({
                        badges: [...currentBadges, badge],
                        updatedAt: { '.sv': 'timestamp' },
                        updatedBy: session.user.id
                    });
                }

                console.log(`✅ [Admin Users API] Added badge ${badge} to user ${userId}`);
                break;

            case 'removeBadge':
                const badgeToRemove = data.badge;
                if (!badgeToRemove) {
                    return NextResponse.json({ 
                        error: 'Bad Request', 
                        message: 'Badge gereklidir' 
                    }, { status: 400 });
                }

                const currentBadgesForRemoval = userData.badges || [];
                await userRef.update({
                    badges: currentBadgesForRemoval.filter((b: string) => b !== badgeToRemove),
                    updatedAt: { '.sv': 'timestamp' },
                    updatedBy: session.user.id
                });

                console.log(`✅ [Admin Users API] Removed badge ${badgeToRemove} from user ${userId}`);
                break;

            default:
                return NextResponse.json({ 
                    error: 'Bad Request', 
                    message: 'Geçersiz eylem' 
                }, { status: 400 });
        }

        // Get updated user data
        const updatedSnapshot = await userRef.get();
        const updatedUser = updatedSnapshot.val();

        return NextResponse.json({
            success: true,
            message: 'Kullanıcı başarıyla güncellendi',
            user: updatedUser
        });

    } catch (error) {
        console.error('💥 [Admin Users API] PUT Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}