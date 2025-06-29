import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin konfigürasyonu
const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

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

// Database wrapper to prevent connection issues
export async function executeFirebaseOperation<T>(
    operation: (database: any) => Promise<T>
): Promise<T> {
    try {
        const app = initializeFirebaseAdmin();
        const database = getDatabase(app);
        return await operation(database);
    } catch (error) {
        console.error('💥 [Firebase Admin] Operation failed:', error);
        throw error;
    }
}

// Helper functions that use the wrapper
export const getUserById = async (userId: string) => {
    return executeFirebaseOperation(async (db) => {
        const userSnapshot = await db.ref(`users/${userId}`).once('value');
        return userSnapshot.val();
    });
};

export const setUserData = async (userId: string, userData: any) => {
    return executeFirebaseOperation(async (db) => {
        await db.ref(`users/${userId}`).set(userData);
        return true;
    });
};

export const updateUserLastSeen = async (userId: string) => {
    return executeFirebaseOperation(async (db) => {
        await db.ref(`users/${userId}/lastSeen`).set(Date.now());
        return true;
    });
};

export const getConversations = async (userId: string) => {
    return executeFirebaseOperation(async (db) => {
        const snapshot = await db.ref('conversations')
            .orderByChild(`participants/${userId}`)
            .equalTo(true)
            .once('value');
        return snapshot.val() || {};
    });
};

export const getMessages = async (conversationId: string) => {
    return executeFirebaseOperation(async (db) => {
        const snapshot = await db.ref(`messages/${conversationId}`)
            .orderByChild('timestamp')
            .once('value');
        return snapshot.val() || {};
    });
};

export const createMessage = async (conversationId: string, messageData: any) => {
    return executeFirebaseOperation(async (db) => {
        const messageRef = db.ref(`messages/${conversationId}`).push();
        await messageRef.set(messageData);
        return messageRef.key;
    });
};

export const updateConversation = async (conversationId: string, updateData: any) => {
    return executeFirebaseOperation(async (db) => {
        await db.ref(`conversations/${conversationId}`).update(updateData);
        return true;
    });
};

export const createConversation = async (conversationData: any) => {
    return executeFirebaseOperation(async (db) => {
        const conversationRef = db.ref('conversations').push();
        await conversationRef.set(conversationData);
        return conversationRef.key;
    });
};

export const getNotifications = async (userId: string, limit: number = 50) => {
    return executeFirebaseOperation(async (db) => {
        const snapshot = await db.ref(`notifications/${userId}`)
            .orderByChild('timestamp')
            .limitToLast(limit)
            .once('value');
        return snapshot.val() || {};
    });
};

export const createNotification = async (userId: string, notificationData: any) => {
    return executeFirebaseOperation(async (db) => {
        const notificationRef = db.ref(`notifications/${userId}`).push();
        await notificationRef.set(notificationData);
        return notificationRef.key;
    });
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
    return executeFirebaseOperation(async (db) => {
        await db.ref(`notifications/${userId}/${notificationId}/read`).set(true);
        await db.ref(`notifications/${userId}/${notificationId}/readAt`).set(Date.now());
        return true;
    });
};

// Legacy exports for compatibility (deprecated - use wrapper functions above)
const app = initializeFirebaseAdmin();
export const adminDatabase = getDatabase(app);
export const adminAuth = getAuth(app); 