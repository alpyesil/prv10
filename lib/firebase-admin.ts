import { initializeApp, getApps, cert, ServiceAccount, deleteApp } from 'firebase-admin/app';
import { getDatabase, Database } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin konfigürasyonu
const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

// Singleton database instance
let databaseInstance: Database | null = null;
let appInstance: any = null;

// Clean up function for development hot reload
function cleanupExistingApps() {
    const apps = getApps();
    if (apps.length > 0) {
        console.log('🧹 [Firebase Admin] Cleaning up existing apps:', apps.length);
        apps.forEach(app => {
            try {
                deleteApp(app);
            } catch (error) {
                // Silently ignore cleanup errors
            }
        });
        databaseInstance = null;
        appInstance = null;
    }
}

// Initialize Firebase Admin App only once
function initializeFirebaseAdmin() {
    if (!appInstance) {
        // Clean up any existing apps first (for development)
        if (process.env.NODE_ENV === 'development') {
            cleanupExistingApps();
        }
        
        console.log('🔥 [Firebase Admin] Initializing Firebase Admin App');
        appInstance = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: databaseURL,
        });
    }
    return appInstance;
}

// Get database instance (singleton)
function getDatabaseInstance(): Database {
    if (!databaseInstance) {
        const app = initializeFirebaseAdmin();
        databaseInstance = getDatabase(app);
        console.log('🔥 [Firebase Admin] Database instance created');
    }
    return databaseInstance;
}

// Simple cache for user data to prevent duplicate requests
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Database wrapper to prevent connection issues
export async function executeFirebaseOperation<T>(
    operation: (database: Database) => Promise<T>
): Promise<T> {
    try {
        const database = getDatabaseInstance();
        return await operation(database);
    } catch (error) {
        console.error('💥 [Firebase Admin] Operation failed:', error);
        
        // If it's the listener error, try to reinitialize
        if (error instanceof Error && error.message.includes('listen() called twice')) {
            console.log('🔄 [Firebase Admin] Reinitializing due to listener error');
            databaseInstance = null;
            appInstance = null;
            
            // Retry once
            const database = getDatabaseInstance();
            return await operation(database);
        }
        
        throw error;
    }
}

// Helper functions that use the wrapper
export const getUserById = async (userId: string) => {
    // Check cache first
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📋 [Firebase Admin] Returning cached user data for ${userId}`);
        return cached.data;
    }

    try {
        const userData = await executeFirebaseOperation(async (db) => {
            const userSnapshot = await db.ref(`users/${userId}`).once('value');
            return userSnapshot.val();
        });

        // Cache the result
        userCache.set(userId, { data: userData, timestamp: Date.now() });
        
        return userData;
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error getting user ${userId}:`, error);
        throw error;
    }
};

export const setUserData = async (userId: string, userData: any) => {
    try {
        const result = await executeFirebaseOperation(async (db) => {
            await db.ref(`users/${userId}`).set(userData);
            return true;
        });

        // Invalidate cache
        userCache.delete(userId);
        
        return result;
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error setting user data for ${userId}:`, error);
        throw error;
    }
};

export const updateUserLastSeen = async (userId: string) => {
    try {
        const result = await executeFirebaseOperation(async (db) => {
            await db.ref(`users/${userId}/lastSeen`).set(Date.now());
            return true;
        });

        // Invalidate cache
        userCache.delete(userId);
        
        return result;
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error updating last seen for ${userId}:`, error);
        throw error;
    }
};

export const getConversations = async (userId: string) => {
    try {
        return await executeFirebaseOperation(async (db) => {
            const snapshot = await db.ref('conversations')
                .orderByChild(`participants/${userId}`)
                .equalTo(true)
                .once('value');
            return snapshot.val() || {};
        });
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error getting conversations for ${userId}:`, error);
        throw error;
    }
};

export const getMessages = async (conversationId: string) => {
    try {
        return await executeFirebaseOperation(async (db) => {
            const snapshot = await db.ref(`messages/${conversationId}`)
                .orderByChild('timestamp')
                .once('value');
            return snapshot.val() || {};
        });
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error getting messages for ${conversationId}:`, error);
        throw error;
    }
};

export const createMessage = async (conversationId: string, messageData: any) => {
    try {
        return await executeFirebaseOperation(async (db) => {
            const messageRef = db.ref(`messages/${conversationId}`).push();
            await messageRef.set(messageData);
            return messageRef.key;
        });
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error creating message in ${conversationId}:`, error);
        throw error;
    }
};

export const updateConversation = async (conversationId: string, updateData: any) => {
    try {
        return await executeFirebaseOperation(async (db) => {
            await db.ref(`conversations/${conversationId}`).update(updateData);
            return true;
        });
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error updating conversation ${conversationId}:`, error);
        throw error;
    }
};

export const createConversation = async (conversationData: any) => {
    try {
        return await executeFirebaseOperation(async (db) => {
            const conversationRef = db.ref('conversations').push();
            await conversationRef.set(conversationData);
            return conversationRef.key;
        });
    } catch (error) {
        console.error('💥 [Firebase Admin] Error creating conversation:', error);
        throw error;
    }
};

export const getNotifications = async (userId: string, limit: number = 50) => {
    try {
        return await executeFirebaseOperation(async (db) => {
            const snapshot = await db.ref(`notifications/${userId}`)
                .orderByChild('timestamp')
                .limitToLast(limit)
                .once('value');
            return snapshot.val() || {};
        });
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error getting notifications for ${userId}:`, error);
        throw error;
    }
};

export const createNotification = async (userId: string, notificationData: any) => {
    try {
        return await executeFirebaseOperation(async (db) => {
            const notificationRef = db.ref(`notifications/${userId}`).push();
            await notificationRef.set(notificationData);
            return notificationRef.key;
        });
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error creating notification for ${userId}:`, error);
        throw error;
    }
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    try {
        return await executeFirebaseOperation(async (db) => {
            await db.ref(`notifications/${userId}/${notificationId}/read`).set(true);
            await db.ref(`notifications/${userId}/${notificationId}/readAt`).set(Date.now());
            return true;
        });
    } catch (error) {
        console.error(`💥 [Firebase Admin] Error marking notification as read:`, error);
        throw error;
    }
};

// Legacy exports for compatibility (deprecated - use wrapper functions above)
export const adminDatabase = getDatabaseInstance();
export const adminAuth = getAuth(initializeFirebaseAdmin());