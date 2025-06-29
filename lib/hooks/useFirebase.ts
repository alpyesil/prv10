"use client";

import { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, off, push, set, remove, serverTimestamp } from 'firebase/database';
import { Game, Announcement, Event, User } from '../firebase';

// Games hook
export const useGames = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const gamesRef = ref(database, 'games');

        const unsubscribe = onValue(gamesRef, (snapshot) => {
            if (snapshot.exists()) {
                const gamesData = snapshot.val();
                const gamesArray = Object.values(gamesData) as Game[];
                setGames(gamesArray.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            } else {
                setGames([]);
            }
            setLoading(false);
        });

        return () => off(gamesRef);
    }, []);

    const createGame = async (gameData: Omit<Game, 'id' | 'createdAt' | 'status'>) => {
        try {
            const gamesRef = ref(database, 'games');
            const newGameRef = push(gamesRef);
            await set(newGameRef, {
                ...gameData,
                id: newGameRef.key,
                createdAt: serverTimestamp(),
                status: 'scheduled',
            });
            return newGameRef.key;
        } catch (error) {
            console.error('Error creating game:', error);
            return null;
        }
    };

    const joinGame = async (gameId: string, userId: string) => {
        try {
            const gameRef = ref(database, `games/${gameId}`);
            const game = games.find(g => g.id === gameId);
            if (game && !game.participants.includes(userId)) {
                const updatedParticipants = [...game.participants, userId];
                await set(ref(database, `games/${gameId}/participants`), updatedParticipants);
            }
        } catch (error) {
            console.error('Error joining game:', error);
        }
    };

    const leaveGame = async (gameId: string, userId: string) => {
        try {
            const game = games.find(g => g.id === gameId);
            if (game && game.participants.includes(userId)) {
                const updatedParticipants = game.participants.filter(id => id !== userId);
                await set(ref(database, `games/${gameId}/participants`), updatedParticipants);
            }
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    };

    return {
        games,
        loading,
        createGame,
        joinGame,
        leaveGame,
    };
};

// Announcements hook
export const useAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const announcementsRef = ref(database, 'announcements');

        const unsubscribe = onValue(announcementsRef, (snapshot) => {
            if (snapshot.exists()) {
                const announcementsData = snapshot.val();
                const announcementsArray = Object.values(announcementsData) as Announcement[];
                setAnnouncements(
                    announcementsArray
                        .filter(announcement => announcement.isVisible)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                );
            } else {
                setAnnouncements([]);
            }
            setLoading(false);
        });

        return () => off(announcementsRef);
    }, []);

    return {
        announcements,
        loading,
    };
};

// Users hook
export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersRef = ref(database, 'users');

        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const usersArray = Object.values(usersData) as User[];
                setUsers(usersArray.sort((a, b) => {
                    // Role'e göre sırala (admin > moderator > member)
                    const roleWeight = (roles: string[]) => {
                        if (roles.includes('admin')) return 3;
                        if (roles.includes('moderator')) return 2;
                        return 1;
                    };
                    return roleWeight(b.roles) - roleWeight(a.roles);
                }));
            } else {
                setUsers([]);
            }
            setLoading(false);
        });

        return () => off(usersRef);
    }, []);

    return {
        users,
        loading,
    };
};

// Events hook
export const useEvents = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const eventsRef = ref(database, 'events');

        const unsubscribe = onValue(eventsRef, (snapshot) => {
            if (snapshot.exists()) {
                const eventsData = snapshot.val();
                const eventsArray = Object.values(eventsData) as Event[];
                setEvents(
                    eventsArray.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                );
            } else {
                setEvents([]);
            }
            setLoading(false);
        });

        return () => off(eventsRef);
    }, []);

    const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt'>) => {
        try {
            const eventsRef = ref(database, 'events');
            const newEventRef = push(eventsRef);
            await set(newEventRef, {
                ...eventData,
                id: newEventRef.key,
                createdAt: serverTimestamp(),
            });
            return newEventRef.key;
        } catch (error) {
            console.error('Error creating event:', error);
            return null;
        }
    };

    return {
        events,
        loading,
        createEvent,
    };
}; 