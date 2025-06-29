"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Notification {
    id: string;
    type: 'new_message' | 'friend_request' | 'mention' | 'system';
    fromUserId: string;
    fromUserInfo: {
        username: string;
        displayName: string;
        avatar: string;
    };
    data: Record<string, any>;
    read: boolean;
    timestamp: number;
    createdAt: string;
    readAt?: number;
}

interface NotificationsData {
    notifications: Notification[];
    total: number;
    unreadCount: number;
    lastFetch: string;
}

export function useNotifications() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<NotificationsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);

    // Fetch notifications
    const fetchNotifications = async (unreadOnly: boolean = false, limit: number = 50) => {
        if (!session?.user) return;

        try {
            console.log('🔔 [useNotifications] Fetching notifications:', { unreadOnly, limit });
            setLoading(true);
            setError(null);

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const queryParams = new URLSearchParams({
                ...(unreadOnly && { unreadOnly: 'true' }),
                limit: limit.toString()
            });

            const response = await fetch(`/api/notifications?${queryParams}`, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ [useNotifications] Notifications fetched:', data);
            setNotifications(data);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('💥 [useNotifications] Fetch error:', error);
                setError('Failed to load notifications');
            }
        } finally {
            setLoading(false);
        }
    };

    // Create notification
    const createNotification = async (
        toUserId: string,
        type: string,
        data: Record<string, any> = {}
    ) => {
        if (!session?.user) return false;

        try {
            console.log('🔔 [useNotifications] Creating notification:', { toUserId, type, data });

            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create',
                    toUserId,
                    type,
                    data
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ [useNotifications] Notification created:', result);
            return result.notificationId;

        } catch (error) {
            console.error('💥 [useNotifications] Create notification error:', error);
            setError('Failed to create notification');
            return false;
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        if (!session?.user) return false;

        try {
            console.log('👁️ [useNotifications] Marking notification as read:', notificationId);

            // Optimistically update local state
            setNotifications(prev => prev ? {
                ...prev,
                notifications: prev.notifications.map(notif =>
                    notif.id === notificationId
                        ? { ...notif, read: true, readAt: Date.now() }
                        : notif
                ),
                unreadCount: Math.max(0, prev.unreadCount - 1)
            } : null);

            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'markRead',
                    notificationId
                }),
            });

            if (!response.ok) {
                // Revert optimistic update on error
                setNotifications(prev => prev ? {
                    ...prev,
                    notifications: prev.notifications.map(notif =>
                        notif.id === notificationId
                            ? { ...notif, read: false, readAt: undefined }
                            : notif
                    ),
                    unreadCount: prev.unreadCount + 1
                } : null);

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ [useNotifications] Notification marked as read');
            return true;

        } catch (error) {
            console.error('💥 [useNotifications] Mark as read error:', error);
            setError('Failed to mark notification as read');
            return false;
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        if (!session?.user) return false;

        try {
            console.log('👁️ [useNotifications] Marking all notifications as read');

            // Optimistically update local state
            const currentUnreadCount = notifications?.unreadCount || 0;
            setNotifications(prev => prev ? {
                ...prev,
                notifications: prev.notifications.map(notif =>
                    notif.read ? notif : { ...notif, read: true, readAt: Date.now() }
                ),
                unreadCount: 0
            } : null);

            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'markAllRead'
                }),
            });

            if (!response.ok) {
                // Revert optimistic update on error
                setNotifications(prev => prev ? {
                    ...prev,
                    notifications: prev.notifications.map(notif => ({
                        ...notif,
                        read: notif.readAt ? (notif.readAt < Date.now() - 1000) : notif.read,
                        readAt: notif.readAt && notif.readAt >= Date.now() - 1000 ? undefined : notif.readAt
                    })),
                    unreadCount: currentUnreadCount
                } : null);

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ [useNotifications] All notifications marked as read:', result.updatedCount);
            return true;

        } catch (error) {
            console.error('💥 [useNotifications] Mark all as read error:', error);
            setError('Failed to mark all notifications as read');
            return false;
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId: string) => {
        if (!session?.user) return false;

        try {
            console.log('🗑️ [useNotifications] Deleting notification:', notificationId);

            // Optimistically remove from local state
            const notificationToDelete = notifications?.notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev ? {
                ...prev,
                notifications: prev.notifications.filter(notif => notif.id !== notificationId),
                total: prev.total - 1,
                unreadCount: notificationToDelete && !notificationToDelete.read ? prev.unreadCount - 1 : prev.unreadCount
            } : null);

            const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    notificationId
                }),
            });

            if (!response.ok) {
                // Revert optimistic update on error
                if (notificationToDelete) {
                    setNotifications(prev => prev ? {
                        ...prev,
                        notifications: [...prev.notifications, notificationToDelete].sort((a, b) => b.timestamp - a.timestamp),
                        total: prev.total + 1,
                        unreadCount: !notificationToDelete.read ? prev.unreadCount + 1 : prev.unreadCount
                    } : null);
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ [useNotifications] Notification deleted');
            return true;

        } catch (error) {
            console.error('💥 [useNotifications] Delete notification error:', error);
            setError('Failed to delete notification');
            return false;
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_message':
                return '💬';
            case 'friend_request':
                return '👥';
            case 'mention':
                return '@';
            case 'system':
                return '🔔';
            default:
                return '📋';
        }
    };

    // Get notification title based on type
    const getNotificationTitle = (notification: Notification) => {
        switch (notification.type) {
            case 'new_message':
                return `${notification.fromUserInfo.displayName} size mesaj gönderdi`;
            case 'friend_request':
                return `${notification.fromUserInfo.displayName} arkadaşlık isteği gönderdi`;
            case 'mention':
                return `${notification.fromUserInfo.displayName} sizi bahsetti`;
            case 'system':
                return 'Sistem bildirimi';
            default:
                return 'Yeni bildirim';
        }
    };

    // Format notification time
    const formatNotificationTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'şimdi';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} gün önce`;

        return new Date(timestamp).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short'
        });
    };

    // Auto-fetch notifications on mount
    useEffect(() => {
        if (session?.user) {
            fetchNotifications();
        }

        // Cleanup on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [session]);

    // Auto-refresh notifications periodically
    useEffect(() => {
        if (!session?.user) return;

        const interval = setInterval(() => {
            if (!loading) {
                fetchNotifications();
            }
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [session, loading]);

    return {
        // Data
        notifications,
        loading,
        error,

        // Actions
        fetchNotifications,
        createNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,

        // Utilities
        getNotificationIcon,
        getNotificationTitle,
        formatNotificationTime,
    };
} 