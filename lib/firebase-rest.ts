// Firebase REST API client for server-side operations
// This avoids the Firebase Admin SDK listener issues in development

const FIREBASE_DATABASE_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

interface FirebaseAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

// Cache for access token
let accessTokenCache: { token: string; expiresAt: number } | null = null;

// Get Firebase access token using service account
async function getAccessToken(): Promise<string> {
    // Check cache first
    if (accessTokenCache && Date.now() < accessTokenCache.expiresAt) {
        return accessTokenCache.token;
    }

    const serviceAccount = {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        project_id: process.env.FIREBASE_PROJECT_ID,
    };

    if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
        throw new Error('Missing Firebase service account credentials');
    }

    try {
        // Create JWT for Google OAuth2
        const jwt = await import('jsonwebtoken');
        const now = Math.floor(Date.now() / 1000);
        
        const payload = {
            iss: serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now,
        };

        const token = jwt.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });

        // Exchange JWT for access token
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: token,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to get access token: ${response.statusText}`);
        }

        const authData: FirebaseAuthResponse = await response.json();
        
        // Cache the token (expires in 1 hour, cache for 50 minutes)
        accessTokenCache = {
            token: authData.access_token,
            expiresAt: Date.now() + (50 * 60 * 1000),
        };

        return authData.access_token;
    } catch (error) {
        console.error('💥 [Firebase REST] Error getting access token:', error);
        throw error;
    }
}

// Make authenticated request to Firebase REST API
async function firebaseRequest(path: string, method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' = 'GET', data?: any): Promise<any> {
    const accessToken = await getAccessToken();
    const url = `${FIREBASE_DATABASE_URL}${path}.json?access_token=${accessToken}`;

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data && (method === 'PUT' || method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`Firebase REST API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// Simple cache for user data
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// REST API based Firebase operations
export const getUserById = async (userId: string) => {
    // Check cache first
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📋 [Firebase REST] Returning cached user data for ${userId}`);
        return cached.data;
    }

    try {
        console.log(`🔍 [Firebase REST] Fetching user ${userId}`);
        const userData = await firebaseRequest(`/users/${userId}`);
        
        // Cache the result
        userCache.set(userId, { data: userData, timestamp: Date.now() });
        
        return userData;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error getting user ${userId}:`, error);
        throw error;
    }
};

export const setUserData = async (userId: string, userData: any) => {
    try {
        console.log(`💾 [Firebase REST] Setting user data for ${userId}`);
        await firebaseRequest(`/users/${userId}`, 'PUT', userData);
        
        // Invalidate cache
        userCache.delete(userId);
        
        return true;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error setting user data for ${userId}:`, error);
        throw error;
    }
};

export const updateUserLastSeen = async (userId: string) => {
    try {
        console.log(`⏰ [Firebase REST] Updating last seen for ${userId}`);
        await firebaseRequest(`/users/${userId}/lastSeen`, 'PUT', Date.now());
        
        // Invalidate cache
        userCache.delete(userId);
        
        return true;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error updating last seen for ${userId}:`, error);
        throw error;
    }
};

export const getConversations = async (userId: string) => {
    try {
        console.log(`💬 [Firebase REST] Getting conversations for ${userId}`);
        
        // Firebase REST API doesn't support complex queries easily
        // For now, get all conversations and filter client-side
        const allConversations = await firebaseRequest('/conversations');
        
        if (!allConversations) return {};
        
        // Filter conversations where user is a participant
        const userConversations: any = {};
        Object.entries(allConversations).forEach(([id, conversation]: [string, any]) => {
            if (conversation.participants && conversation.participants[userId]) {
                userConversations[id] = conversation;
            }
        });
        
        return userConversations;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error getting conversations for ${userId}:`, error);
        throw error;
    }
};

export const getMessages = async (conversationId: string) => {
    try {
        console.log(`📨 [Firebase REST] Getting messages for ${conversationId}`);
        const messages = await firebaseRequest(`/messages/${conversationId}`);
        return messages || {};
    } catch (error) {
        console.error(`💥 [Firebase REST] Error getting messages for ${conversationId}:`, error);
        throw error;
    }
};

export const createMessage = async (conversationId: string, messageData: any) => {
    try {
        console.log(`✍️ [Firebase REST] Creating message in ${conversationId}`);
        
        // Generate a unique key
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await firebaseRequest(`/messages/${conversationId}/${messageId}`, 'PUT', messageData);
        
        return messageId;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error creating message in ${conversationId}:`, error);
        throw error;
    }
};

export const updateConversation = async (conversationId: string, updateData: any) => {
    try {
        console.log(`🔄 [Firebase REST] Updating conversation ${conversationId}`);
        await firebaseRequest(`/conversations/${conversationId}`, 'PATCH', updateData);
        return true;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error updating conversation ${conversationId}:`, error);
        throw error;
    }
};

export const createConversation = async (conversationData: any) => {
    try {
        console.log(`➕ [Firebase REST] Creating conversation`);
        
        // Generate a unique key
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await firebaseRequest(`/conversations/${conversationId}`, 'PUT', conversationData);
        
        return conversationId;
    } catch (error) {
        console.error('💥 [Firebase REST] Error creating conversation:', error);
        throw error;
    }
};

export const getNotifications = async (userId: string, limit: number = 50) => {
    try {
        console.log(`🔔 [Firebase REST] Getting notifications for ${userId}`);
        const notifications = await firebaseRequest(`/notifications/${userId}`);
        
        if (!notifications) return {};
        
        // Sort by timestamp and limit
        const sortedNotifications = Object.entries(notifications)
            .sort(([, a]: [string, any], [, b]: [string, any]) => b.timestamp - a.timestamp)
            .slice(0, limit)
            .reduce((acc, [id, notification]) => {
                acc[id] = notification;
                return acc;
            }, {} as any);
        
        return sortedNotifications;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error getting notifications for ${userId}:`, error);
        throw error;
    }
};

export const createNotification = async (userId: string, notificationData: any) => {
    try {
        console.log(`📢 [Firebase REST] Creating notification for ${userId}`);
        
        // Generate a unique key
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await firebaseRequest(`/notifications/${userId}/${notificationId}`, 'PUT', notificationData);
        
        return notificationId;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error creating notification for ${userId}:`, error);
        throw error;
    }
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    try {
        console.log(`✅ [Firebase REST] Marking notification as read: ${notificationId}`);
        await firebaseRequest(`/notifications/${userId}/${notificationId}/read`, 'PUT', true);
        await firebaseRequest(`/notifications/${userId}/${notificationId}/readAt`, 'PUT', Date.now());
        return true;
    } catch (error) {
        console.error(`💥 [Firebase REST] Error marking notification as read:`, error);
        throw error;
    }
};