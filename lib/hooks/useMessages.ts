"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: number;
    type: 'text' | 'image' | 'file';
    status: 'sending' | 'sent' | 'delivered' | 'read';
    senderInfo: {
        username: string;
        displayName: string;
        avatar: string;
    };
}

interface Conversation {
    id: string;
    participants: string[];
    lastMessage?: {
        id: string;
        senderId: string;
        content: string;
        timestamp: number;
        type: string;
    };
    unreadCount: number;
    updatedAt: number;
    participantInfo: Record<string, {
        username: string;
        displayName: string;
        avatar: string;
        isOnline: boolean;
    }>;
}

interface ConversationsData {
    conversations: Conversation[];
    total: number;
    lastFetch: string;
}

interface MessagesData {
    messages: Message[];
    conversationId: string;
    total: number;
    lastFetch: string;
}

interface UserRegistrationError {
    error: string;
    message: string;
    userRegistered: boolean;
    userId?: string;
    recipientId?: string;
}

export function useMessages() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<ConversationsData | null>(null);
    const [currentMessages, setCurrentMessages] = useState<MessagesData | null>(null);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
    const [registrationError, setRegistrationError] = useState<UserRegistrationError | null>(null);

    // Refs for cleanup
    const abortControllerRef = useRef<AbortController | null>(null);

    // Ensure user is registered
    const ensureUserRegistered = async () => {
        if (!session?.user) return false;

        try {
            // Check if user is already registered
            const checkResponse = await fetch('/api/users');

            if (!checkResponse.ok) {
                const errorText = await checkResponse.text();
                console.error('💥 [useMessages] User check failed:', checkResponse.status, errorText);
                setError(`User check failed: ${checkResponse.status}`);
                return false;
            }

            const checkData = await checkResponse.json();

            if (!checkData.isRegistered) {
                // Register user
                const registerResponse = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'register' })
                });

                if (!registerResponse.ok) {
                    const errorText = await registerResponse.text();
                    console.error('💥 [useMessages] User registration failed:', registerResponse.status, errorText);
                    setError(`User registration failed: ${registerResponse.status}`);
                    return false;
                }

                console.log('✅ [useMessages] User registered successfully');
            }

            return true;
        } catch (error) {
            console.error('💥 [useMessages] User registration error:', error);
            setError('Failed to register user');
            return false;
        }
    };

    // Update last seen timestamp
    const updateLastSeen = async () => {
        if (!session?.user) return;

        try {
            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'updateLastSeen' })
            });
        } catch (error) {
            console.error('💥 [useMessages] Update last seen error:', error);
        }
    };

    // Fetch conversations list
    const fetchConversations = async () => {
        if (!session?.user) return;

        const isRegistered = await ensureUserRegistered();
        if (!isRegistered) return;

        try {
            console.log('📋 [useMessages] Fetching conversations');
            setLoading(true);
            setError(null);
            setRegistrationError(null);

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const response = await fetch('/api/messages', {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ [useMessages] Conversations fetched:', data);
            setConversations(data);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('💥 [useMessages] Fetch conversations error:', error);
                setError('Failed to load conversations');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages for specific conversation
    const fetchMessages = async (conversationId: string) => {
        if (!session?.user) return;

        try {
            console.log('💬 [useMessages] Fetching messages for conversation:', conversationId);
            setLoading(true);
            setError(null);
            setRegistrationError(null);

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const response = await fetch(`/api/messages?conversationId=${conversationId}`, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ [useMessages] Messages fetched:', data);
            setCurrentMessages(data);
            setCurrentConversationId(conversationId);

        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('💥 [useMessages] Fetch messages error:', error);
                setError('Failed to load messages');
            }
        } finally {
            setLoading(false);
        }
    };

    // Start new conversation with user
    const startConversation = async (userId: string) => {
        if (!session?.user) return null;

        const isRegistered = await ensureUserRegistered();
        if (!isRegistered) return null;

        try {
            console.log('🆕 [useMessages] Starting conversation with user:', userId);
            setLoading(true);
            setError(null);
            setRegistrationError(null);

            const response = await fetch(`/api/messages?userId=${userId}`);

            if (!response.ok) {
                const errorData = await response.json();

                // Handle user not registered error
                if (errorData.error === 'User not registered') {
                    console.log('⚠️ [useMessages] Target user not registered:', errorData);
                    setRegistrationError(errorData);
                    return null;
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ [useMessages] Conversation result:', data);

            // Fetch messages for the conversation
            if (data.conversationId) {
                await fetchMessages(data.conversationId);
            }

            return data.conversationId;

        } catch (error) {
            console.error('💥 [useMessages] Start conversation error:', error);
            setError('Failed to start conversation');
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Send message
    const sendMessage = async (content: string, conversationId?: string, recipientId?: string) => {
        if (!session?.user || !content.trim()) return false;

        const isRegistered = await ensureUserRegistered();
        if (!isRegistered) return false;

        try {
            console.log('📤 [useMessages] Sending message:', { content, conversationId, recipientId });
            setRegistrationError(null);

            // Optimistically add message to current messages
            if (currentMessages && (conversationId === currentConversationId || conversationId)) {
                const optimisticMessage: Message = {
                    id: `temp_${Date.now()}`,
                    conversationId: conversationId || currentConversationId || '',
                    senderId: session.user.id,
                    content: content.trim(),
                    timestamp: Date.now(),
                    type: 'text',
                    status: 'sending',
                    senderInfo: {
                        username: session.user.name || 'User',
                        displayName: session.user.name || 'User',
                        avatar: session.user.image || ''
                    }
                };

                setCurrentMessages(prev => prev ? {
                    ...prev,
                    messages: [...prev.messages, optimisticMessage]
                } : null);
            }

            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content.trim(),
                    conversationId,
                    recipientId,
                    type: 'text'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Handle recipient not registered error
                if (errorData.error === 'Recipient not registered') {
                    console.log('⚠️ [useMessages] Recipient not registered:', errorData);
                    setRegistrationError(errorData);

                    // Remove optimistic message
                    if (currentMessages) {
                        setCurrentMessages(prev => prev ? {
                            ...prev,
                            messages: prev.messages.filter(msg => !(msg.status === 'sending' && msg.content === content.trim()))
                        } : null);
                    }

                    return false;
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ [useMessages] Message sent:', data);

            // Update optimistic message with real data
            if (currentMessages) {
                setCurrentMessages(prev => prev ? {
                    ...prev,
                    messages: prev.messages.map(msg =>
                        msg.status === 'sending' && msg.senderId === session.user.id && msg.content === content.trim()
                            ? { ...data.message }
                            : msg
                    )
                } : null);
            }

            // Refresh conversations to update last message
            setTimeout(() => {
                fetchConversations();
            }, 100);

            return true;

        } catch (error) {
            console.error('💥 [useMessages] Send message error:', error);
            setError('Failed to send message');

            // Remove optimistic message on error
            if (currentMessages) {
                setCurrentMessages(prev => prev ? {
                    ...prev,
                    messages: prev.messages.filter(msg => !(msg.status === 'sending' && msg.content === content.trim()))
                } : null);
            }

            return false;
        }
    };

    // Mark conversation as read
    const markAsRead = async (conversationId: string) => {
        console.log('👁️ [useMessages] Marking conversation as read:', conversationId);

        // Update local state immediately
        setConversations(prev => prev ? {
            ...prev,
            conversations: prev.conversations.map(conv =>
                conv.id === conversationId
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        } : null);

        // In real app, call API to mark messages as read
        // This would be implemented in the API to mark all messages in conversation as read
    };

    // Clear registration error
    const clearRegistrationError = () => {
        setRegistrationError(null);
    };

    // Simulate typing indicator
    const setTypingStatus = (conversationId: string, isTypingStatus: boolean) => {
        setIsTyping(prev => ({
            ...prev,
            [conversationId]: isTypingStatus
        }));

        // Auto-clear typing after 3 seconds
        if (isTypingStatus) {
            setTimeout(() => {
                setIsTyping(prev => ({
                    ...prev,
                    [conversationId]: false
                }));
            }, 3000);
        }
    };

    // Get other participant info
    const getOtherParticipant = (conversation: Conversation) => {
        if (!session?.user) return null;

        const otherParticipantId = conversation.participants.find(p => p !== session.user.id);
        return otherParticipantId ? conversation.participantInfo[otherParticipantId] : null;
    };

    // Auto-fetch conversations on mount and register user
    useEffect(() => {
        if (session?.user) {
            fetchConversations();
            updateLastSeen();
        }

        // Cleanup on unmount
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [session]);

    // Update last seen periodically
    useEffect(() => {
        if (!session?.user) return;

        const interval = setInterval(() => {
            updateLastSeen();
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [session]);

    // Auto-refresh conversations periodically
    useEffect(() => {
        if (!session?.user) return;

        const interval = setInterval(() => {
            if (!loading) {
                fetchConversations();
            }
        }, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, [session, loading]);

    return {
        // Data
        conversations,
        currentMessages,
        currentConversationId,
        loading,
        error,
        isTyping,
        registrationError,

        // Actions
        fetchConversations,
        fetchMessages,
        startConversation,
        sendMessage,
        markAsRead,
        setTypingStatus,
        clearRegistrationError,

        // Utilities
        getOtherParticipant,
    };
} 