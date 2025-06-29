import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

// Firebase konfigürasyon objesi
const firebaseConfig = {
    apiKey: "AIzaSyCyuVyAPK0opsBl7wnQxQ_dDVD72NhAstQ",
    authDomain: "prv10-12ea2.firebaseapp.com",
    databaseURL: "https://prv10-12ea2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "prv10-12ea2",
    storageBucket: "prv10-12ea2.firebasestorage.app",
    messagingSenderId: "1070953493962",
    appId: "1:1070953493962:web:3c8c61f4f0b7c5e1b8e9a2"
};

console.log('🔥 [Firebase] Initializing app with config:', {
    projectId: firebaseConfig.projectId,
    databaseURL: firebaseConfig.databaseURL,
    authDomain: firebaseConfig.authDomain
});

// Firebase app'i başlat (sadece bir kez)
let app: FirebaseApp;
let database: Database;

try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('✅ [Firebase] App and database initialized successfully');
    console.log('📍 [Firebase] Database instance:', database);
} catch (error) {
    console.error('💥 [Firebase] Initialization failed:', error);
    throw error;
}

// Firebase servislerini export et
export const auth: Auth = getAuth(app);
export default app;

// Type definitions for Firebase data
export interface User {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    avatar?: string;
    roles: string[];
    permissions: string[];
    joinedAt: string;
    lastSeen: string;
    isOnline: boolean;
}

export interface Game {
    id: string;
    name: string;
    description: string;
    image?: string;
    participants: string[];
    maxParticipants?: number;
    scheduledFor?: string;
    createdBy: string;
    createdAt: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    author: string;
    authorId: string;
    createdAt: string;
    updatedAt?: string;
    priority: 'low' | 'medium' | 'high';
    isVisible: boolean;
    targetRoles?: string[];
}

export interface Event {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime?: string;
    participants: string[];
    maxParticipants?: number;
    createdBy: string;
    createdAt: string;
    type: 'game' | 'meeting' | 'tournament' | 'other';
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

// Test Firebase connection
export async function testFirebaseConnection() {
    try {
        console.log('🧪 [Firebase] Testing database connection...');

        const { ref, set, get, serverTimestamp } = await import('firebase/database');

        // Write test
        const testRef = ref(database, 'connection-test');
        const testData = {
            timestamp: Date.now(),
            serverTimestamp,
            test: 'Firebase connection working!'
        };

        console.log('📝 [Firebase] Writing test data:', testData);
        await set(testRef, testData);
        console.log('✅ [Firebase] Test write successful');

        // Read test
        console.log('📖 [Firebase] Reading test data...');
        const snapshot = await get(testRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('✅ [Firebase] Test read successful:', data);
            console.log('✅ [Firebase] Connection test PASSED');
            return { success: true, data };
        } else {
            console.log('⚠️ [Firebase] Test read failed - no data');
            return { success: false, error: 'No data found' };
        }
    } catch (error) {
        console.error('💥 [Firebase] Connection test failed:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

// Debug function to check database status
export function debugFirebaseStatus() {
    console.log('🔍 [Firebase] Debug Status Check');
    console.log('📱 App:', app);
    console.log('🗄️ Database:', database);
    console.log('🔗 Database URL:', database?.app?.options?.databaseURL);
    console.log('🏷️ Project ID:', database?.app?.options?.projectId);

    return {
        app: !!app,
        database: !!database,
        databaseURL: database?.app?.options?.databaseURL,
        projectId: database?.app?.options?.projectId
    };
}

// Add global functions for browser console testing
if (typeof window !== 'undefined') {
    (window as any).testFirebase = testFirebaseConnection;
    (window as any).debugFirebase = debugFirebaseStatus;
    console.log('🌐 [Firebase] Global test functions added: window.testFirebase(), window.debugFirebase()');
}

export { database }; 