import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getUserById,
    getConversations,
    getMessages,
    createMessage,
    updateConversation,
    createConversation,
    createNotification,
    executeFirebaseOperation
} from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        console.log('💬 [Messages API] GET Request received');
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Messages API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');
        const userId = searchParams.get('userId');

        console.log('📊 [Messages API] Query params:', {
            conversationId,
            userId,
            sessionUserId: session.user.id
        });

        if (!conversationId && !userId) {
            // Fetch conversations list
            console.log('📋 [Messages API] Fetching conversations list');

            try {
                const conversationsData = await getConversations(session.user.id);

                const conversations = await Promise.all(
                    Object.entries(conversationsData).map(async ([convId, convData]: [string, any]) => {
                        // Get other participant ID
                        const otherParticipantId = Object.keys(convData.participants || {})
                            .find(id => id !== session.user.id);

                        // Get last message
                        let lastMessage = null;
                        if (convData.lastMessageId) {
                            const messagesData = await getMessages(convId);
                            lastMessage = messagesData[convData.lastMessageId];
                        }

                        // Get participant info
                        let participantInfo: Record<string, any> = {};
                        if (otherParticipantId) {
                            const participantData = await getUserById(otherParticipantId);

                            if (participantData) {
                                participantInfo[otherParticipantId] = {
                                    username: participantData.username || 'Unknown',
                                    displayName: participantData.displayName || 'Unknown',
                                    avatar: participantData.avatar || '',
                                    isOnline: (Date.now() - (participantData.lastSeen || 0)) < 300000 // 5 minutes
                                };
                            }
                        }

                        // Count unread messages
                        const messagesData = await getMessages(convId);
                        const unreadCount = Object.values(messagesData || {}).filter((msg: any) =>
                            msg.senderId !== session.user.id && !msg.read
                        ).length;

                        return {
                            id: convId,
                            participants: Object.keys(convData.participants || {}),
                            lastMessage,
                            unreadCount,
                            updatedAt: convData.updatedAt || Date.now(),
                            participantInfo
                        };
                    })
                );

                console.log('✅ [Messages API] Conversations fetched:', conversations.length);

                return NextResponse.json({
                    conversations: conversations.sort((a, b) => b.updatedAt - a.updatedAt),
                    total: conversations.length,
                    lastFetch: new Date().toISOString()
                });

            } catch (error) {
                console.error('💥 [Messages API] Error fetching conversations:', error);
                return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
            }
        }

        if (conversationId) {
            // Fetch messages for specific conversation
            console.log('💬 [Messages API] Fetching messages for conversation:', conversationId);

            try {
                // Check if user is participant
                const conversationsData = await getConversations(session.user.id);
                const conversationData = conversationsData[conversationId];

                if (!conversationData || !conversationData.participants[session.user.id]) {
                    console.log('❌ [Messages API] User not participant in conversation');
                    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
                }

                // Get messages
                const messagesData = await getMessages(conversationId);

                const messages = await Promise.all(
                    Object.entries(messagesData).map(async ([msgId, msgData]: [string, any]) => {
                        // Get sender info
                        const senderData = await getUserById(msgData.senderId);

                        return {
                            id: msgId,
                            conversationId,
                            senderId: msgData.senderId,
                            content: msgData.content,
                            timestamp: msgData.timestamp,
                            type: msgData.type || 'text',
                            status: msgData.status || 'sent',
                            senderInfo: {
                                username: senderData?.username || 'Unknown',
                                displayName: senderData?.displayName || 'Unknown',
                                avatar: senderData?.avatar || ''
                            }
                        };
                    })
                );

                console.log('✅ [Messages API] Messages fetched:', messages.length);

                return NextResponse.json({
                    messages: messages.sort((a, b) => a.timestamp - b.timestamp),
                    conversationId,
                    total: messages.length,
                    lastFetch: new Date().toISOString()
                });

            } catch (error) {
                console.error('💥 [Messages API] Error fetching messages:', error);
                return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
            }
        }

        if (userId) {
            // Start new conversation with user
            console.log('🆕 [Messages API] Starting new conversation with user:', userId);

            try {
                // Check if target user is registered
                const targetUserData = await getUserById(userId);

                if (!targetUserData || !targetUserData.isRegistered) {
                    console.log('⚠️ [Messages API] Target user not registered:', userId);
                    return NextResponse.json({
                        error: 'User not registered',
                        message: 'Bu kullanıcı henüz siteye kayıt olmamıştır. Mesaj gönderebilmek için kullanıcının önce siteye kayıt olması gerekmektedir.',
                        userRegistered: false,
                        userId
                    }, { status: 400 });
                }

                // Check if conversation already exists
                const conversationsData = await getConversations(session.user.id);

                let existingConversationId = null;
                for (const [convId, convData] of Object.entries(conversationsData)) {
                    const participants = Object.keys((convData as any).participants || {});
                    if (participants.includes(userId) && participants.length === 2) {
                        existingConversationId = convId;
                        break;
                    }
                }

                if (existingConversationId) {
                    console.log('✅ [Messages API] Existing conversation found:', existingConversationId);
                    return NextResponse.json({ conversationId: existingConversationId });
                }

                // Create new conversation
                const conversationData = {
                    participants: {
                        [session.user.id]: true,
                        [userId]: true
                    },
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                const newConversationId = await createConversation(conversationData);

                console.log('✅ [Messages API] New conversation created:', newConversationId);

                return NextResponse.json({ conversationId: newConversationId });

            } catch (error) {
                console.error('💥 [Messages API] Error starting conversation:', error);
                return NextResponse.json({ error: 'Failed to start conversation' }, { status: 500 });
            }
        }

    } catch (error) {
        console.error('💥 [Messages API] GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('💬 [Messages API] POST Request received');
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            console.log('❌ [Messages API] Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('📝 [Messages API] Message data:', { ...body, content: body.content?.substring(0, 50) + '...' });

        const { conversationId, content, type = 'text', recipientId } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        let finalConversationId = conversationId;

        // If no conversationId but recipientId provided, find or create conversation
        if (!finalConversationId && recipientId) {
            // Check if recipient is registered
            const recipientData = await getUserById(recipientId);

            if (!recipientData || !recipientData.isRegistered) {
                console.log('⚠️ [Messages API] Recipient not registered:', recipientId);
                return NextResponse.json({
                    error: 'Recipient not registered',
                    message: 'Bu kullanıcı henüz siteye kayıt olmamıştır. Mesaj gönderebilmek için kullanıcının önce siteye kayıt olması gerekmektedir.',
                    userRegistered: false,
                    recipientId
                }, { status: 400 });
            }

            // Find or create conversation
            const conversationsData = await getConversations(session.user.id);

            for (const [convId, convData] of Object.entries(conversationsData)) {
                const participants = Object.keys((convData as any).participants || {});
                if (participants.includes(recipientId) && participants.length === 2) {
                    finalConversationId = convId;
                    break;
                }
            }

            if (!finalConversationId) {
                // Create new conversation
                const conversationData = {
                    participants: {
                        [session.user.id]: true,
                        [recipientId]: true
                    },
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                finalConversationId = await createConversation(conversationData);
                console.log('✅ [Messages API] New conversation created for message:', finalConversationId);
            }
        }

        if (!finalConversationId) {
            return NextResponse.json({ error: 'No conversation specified' }, { status: 400 });
        }

        // Verify conversation access
        const conversationsData = await getConversations(session.user.id);
        const conversationData = conversationsData[finalConversationId];

        if (!conversationData || !conversationData.participants[session.user.id]) {
            console.log('❌ [Messages API] User not participant in conversation');
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Create message
        const messageData = {
            senderId: session.user.id,
            content: content.trim(),
            type,
            timestamp: Date.now(),
            status: 'sent'
        };

        const messageId = await createMessage(finalConversationId, messageData);

        // Update conversation
        await updateConversation(finalConversationId, {
            lastMessageId: messageId,
            updatedAt: Date.now()
        });

        // Get sender info
        const senderData = await getUserById(session.user.id);

        const responseMessage = {
            id: messageId,
            conversationId: finalConversationId,
            senderId: session.user.id,
            content: content.trim(),
            type,
            timestamp: messageData.timestamp,
            status: 'sent',
            senderInfo: {
                username: senderData?.username || 'Unknown',
                displayName: senderData?.displayName || 'Unknown',
                avatar: senderData?.avatar || ''
            }
        };

        // Create notifications for other participants
        const otherParticipants = Object.keys(conversationData.participants).filter(id => id !== session.user.id);

        for (const participantId of otherParticipants) {
            try {
                const notificationData = {
                    type: 'new_message',
                    fromUserId: session.user.id,
                    fromUserInfo: {
                        username: senderData?.username || 'Unknown',
                        displayName: senderData?.displayName || 'Unknown',
                        avatar: senderData?.avatar || ''
                    },
                    data: {
                        conversationId: finalConversationId,
                        messageId,
                        content: content.trim()
                    },
                    read: false,
                    timestamp: Date.now(),
                    createdAt: Date.now()
                };

                await createNotification(participantId, notificationData);
                console.log('🔔 [Messages API] Notification created for:', participantId);
            } catch (notificationError) {
                console.error('⚠️ [Messages API] Failed to create notification for:', participantId, notificationError);
            }
        }

        console.log('✅ [Messages API] Message sent:', messageId);

        return NextResponse.json({
            success: true,
            message: responseMessage,
            conversationId: finalConversationId
        });

    } catch (error) {
        console.error('💥 [Messages API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 