import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNotifications, createNotification, markNotificationAsRead } from '@/lib/firebase-rest';

export async function GET(request: NextRequest) {
    try {
        console.log('🔔 [Notifications API] GET Request received');
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Notifications API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const limit = parseInt(searchParams.get('limit') || '50');

        console.log('📊 [Notifications API] Query params:', { unreadOnly, limit, userId: session.user.id });

        try {
            const notificationsData = await getNotifications(session.user.id, limit);

            // Convert to array and sort by timestamp (newest first)
            const notifications = Object.entries(notificationsData)
                .map(([id, data]: [string, any]) => ({
                    id,
                    ...data
                }))
                .sort((a, b) => b.timestamp - a.timestamp);

            // Filter unread if requested
            const filteredNotifications = unreadOnly
                ? notifications.filter(n => !n.read)
                : notifications;

            console.log('✅ [Notifications API] Fetched notifications:', {
                total: notifications.length,
                unread: notifications.filter(n => !n.read).length,
                returned: filteredNotifications.length
            });

            return NextResponse.json({
                notifications: filteredNotifications,
                total: notifications.length,
                unreadCount: notifications.filter(n => !n.read).length,
                lastFetch: new Date().toISOString()
            });

        } catch (error) {
            console.error('💥 [Notifications API] Error fetching notifications:', error);
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
        }

    } catch (error) {
        console.error('💥 [Notifications API] GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('🔔 [Notifications API] POST Request received');
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Notifications API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('📝 [Notifications API] Notification data:', body);

        const { action, notificationId, toUserId, type, data } = body;

        if (action === 'create') {
            // Create notification for another user
            if (!toUserId || !type) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const notificationData = {
                type,
                fromUserId: session.user.id,
                fromUserInfo: {
                    username: session.user.name || 'Unknown',
                    displayName: session.user.name || 'Unknown',
                    avatar: session.user.image || ''
                },
                data: data || {},
                read: false,
                readAt: null,
                timestamp: Date.now(),
                createdAt: Date.now()
            };

            const notificationKey = await createNotification(toUserId, notificationData);

            console.log('✅ [Notifications API] Notification created:', {
                id: notificationKey,
                type,
                fromUserId: session.user.id,
                toUserId
            });

            return NextResponse.json({
                success: true,
                notificationId: notificationKey,
                notification: {
                    id: notificationKey,
                    ...notificationData
                }
            });
        }

        if (action === 'markRead') {
            // Mark notification as read
            if (!notificationId) {
                return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
            }

            try {
                await markNotificationAsRead(session.user.id, notificationId);
                console.log('✅ [Notifications API] Notification marked as read:', notificationId);

                return NextResponse.json({ success: true });
            } catch (error) {
                console.error('💥 [Notifications API] Error marking notification as read:', error);
                return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
            }
        }

        if (action === 'markAllRead') {
            // Mark all notifications as read
            try {
                const result = await executeFirebaseOperation(async (db) => {
                    const snapshot = await db.ref(`notifications/${session.user.id}`).once('value');
                    const notifications = snapshot.val() || {};

                    const updates: Record<string, any> = {};
                    Object.keys(notifications).forEach(notificationId => {
                        if (!notifications[notificationId].read) {
                            updates[`${notificationId}/read`] = true;
                            updates[`${notificationId}/readAt`] = Date.now();
                        }
                    });

                    if (Object.keys(updates).length > 0) {
                        await db.ref(`notifications/${session.user.id}`).update(updates);
                    }

                    return Object.keys(updates).length / 2;
                });

                console.log('✅ [Notifications API] All notifications marked as read:', result);

                return NextResponse.json({
                    success: true,
                    updatedCount: result
                });
            } catch (error) {
                console.error('💥 [Notifications API] Error marking all notifications as read:', error);
                return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 });
            }
        }

        if (action === 'delete') {
            // Delete notification
            if (!notificationId) {
                return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
            }

            try {
                await executeFirebaseOperation(async (db) => {
                    await db.ref(`notifications/${session.user.id}/${notificationId}`).remove();
                });

                console.log('✅ [Notifications API] Notification deleted:', notificationId);

                return NextResponse.json({ success: true });
            } catch (error) {
                console.error('💥 [Notifications API] Error deleting notification:', error);
                return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('💥 [Notifications API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 