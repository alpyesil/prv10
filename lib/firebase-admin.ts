import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
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

// Initialize Firebase Admin App only once
function initializeFirebaseAdmin() {
    if (getApps().length === 0) {
        console.log('🔥 [Firebase Admin] Initializing Firebase Admin App');
        initializeApp({
            credential: cert(serviceAccount),
            databaseURL: databaseURL,
        });
    }
    return getApps()[0];
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

// Database wrapper to prevent connection issues
export async function executeFirebaseOperation<T>(
    operation: (database: Database) => Promise<T>
): Promise<T> {
    try {
        const database = getDatabaseInstance();
        return await operation(database);
    } catch (error) {
        console.error('💥 [Firebase Admin] Operation failed:', error);
        throw error;
    }
}

// Helper functions that use the wrapper
export const getUserById = async (userId: string) => {
    return executeFirebaseOperation(async (db) => {
        try {
            const userSnapshot = await db.ref(`users/${userId}`).once('value');
            return userSnapshot.val();
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error getting user ${userId}:`, error);
            throw error;
        }
    });
};

export const setUserData = async (userId: string, userData: any) => {
    return executeFirebaseOperation(async (db) => {
        try {
            await db.ref(`users/${userId}`).set(userData);
            return true;
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error setting user data for ${userId}:`, error);
            throw error;
        }
    });
};

export const updateUserLastSeen = async (userId: string) => {
    return executeFirebaseOperation(async (db) => {
        try {
            await db.ref(`users/${userId}/lastSeen`).set(Date.now());
            return true;
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error updating last seen for ${userId}:`, error);
            throw error;
        }
    });
};

export const getConversations = async (userId: string) => {
    return executeFirebaseOperation(async (db) => {
        try {
            const snapshot = await db.ref('conversations')
                .orderByChild(`participants/${userId}`)
                .equalTo(true)
                .once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error getting conversations for ${userId}:`, error);
            throw error;
        }
    });
};

export const getMessages = async (conversationId: string) => {
    return executeFirebaseOperation(async (db) => {
        try {
            const snapshot = await db.ref(`messages/${conversationId}`)
                .orderByChild('timestamp')
                .once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error getting messages for ${conversationId}:`, error);
            throw error;
        }
    });
};

export const createMessage = async (conversationId: string, messageData: any) => {
    return executeFirebaseOperation(async (db) => {
        try {
            const messageRef = db.ref(`messages/${conversationId}`).push();
            await messageRef.set(messageData);
            return messageRef.key;
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error creating message in ${conversationId}:`, error);
            throw error;
        }
    });
};

export const updateConversation = async (conversationId: string, updateData: any) => {
    return executeFirebaseOperation(async (db) => {
        try {
            await db.ref(`conversations/${conversationId}`).update(updateData);
            return true;
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error updating conversation ${conversationId}:`, error);
            throw error;
        }
    });
};

export const createConversation = async (conversationData: any) => {
    return executeFirebaseOperation(async (db) => {
        try {
            const conversationRef = db.ref('conversations').push();
            await conversationRef.set(conversationData);
            return conversationRef.key;
        } catch (error) {
            console.error('💥 [Firebase Admin] Error creating conversation:', error);
            throw error;
        }
    });
};

export const getNotifications = async (userId: string, limit: number = 50) => {
    return executeFirebaseOperation(async (db) => {
        try {
            const snapshot = await db.ref(`notifications/${userId}`)
                .orderByChild('timestamp')
                .limitToLast(limit)
                .once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error getting notifications for ${userId}:`, error);
            throw error;
        }
    });
};

export const createNotification = async (userId: string, notificationData: any) => {
    return executeFirebaseOperation(async (db) => {
        try {
            const notificationRef = db.ref(`notifications/${userId}`).push();
            await notificationRef.set(notificationData);
            return notificationRef.key;
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error creating notification for ${userId}:`, error);
            throw error;
        }
    });
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    return executeFirebaseOperation(async (db) => {
        try {
            await db.ref(`notifications/${userId}/${notificationId}/read`).set(true);
            await db.ref(`notifications/${userId}/${notificationId}/readAt`).set(Date.now());
            return true;
        } catch (error) {
            console.error(`💥 [Firebase Admin] Error marking notification as read:`, error);
            throw error;
        }
    });
};

// Legacy exports for compatibility (deprecated - use wrapper functions above)
const app = initializeFirebaseAdmin();
export const adminDatabase = getDatabaseInstance();
export const adminAuth = getAuth(app);