"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { useMessages } from '@/lib/hooks/useMessages';
import { useSession } from 'next-auth/react';
import { useToast } from '@/lib/hooks/use-toast';

export default function MessagesPage() {
    const { data: session } = useSession();
    const {
        conversations,
        currentMessages,
        currentConversationId,
        loading,
        error,
        registrationError,
        fetchMessages,
        sendMessage,
        markAsRead,
        getOtherParticipant,
        clearRegistrationError,
    } = useMessages();

    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    // Handle registration error for toast notifications
    useEffect(() => {
        if (registrationError) {
            toast({
                variant: "warning",
                title: "Mesaj Gönderilemedi",
                description: registrationError.message,
            });
            clearRegistrationError();
        }
    }, [registrationError, toast, clearRegistrationError]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages?.messages]);

    const handleSelectConversation = async (conversationId: string) => {
        await fetchMessages(conversationId);
        await markAsRead(conversationId);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || isSubmitting || !currentConversationId) return;

        setIsSubmitting(true);

        const success = await sendMessage(newMessage, currentConversationId);

        if (success) {
            setNewMessage('');
        } else {
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Mesaj gönderilemedi. Tekrar deneyin.",
            });
        }

        setIsSubmitting(false);
    };

    const formatMessageTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) return 'şimdi';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;

        return new Date(timestamp).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatLastMessageTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 86400000) {
            return new Date(timestamp).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        return new Date(timestamp).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short'
        });
    };

    if (!session?.user) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1e1f24] via-[#2a2d31] to-[#36393f] flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🔐</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Giriş Gerekli</h2>
                        <p className="text-gray-400">Mesajlaşma özelliğini kullanmak için giriş yapmalısınız.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="h-screen bg-gradient-to-br from-[#1e1f24] via-[#2a2d31] to-[#36393f] flex flex-col">



                <div className="flex flex-1 min-h-0">
                    {/* Conversations Sidebar */}
                    <div className="w-80 bg-[#2f3136] border-r border-white/10 flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10">
                            <h1 className="text-2xl font-bold text-white mb-2">Mesajlar</h1>
                            <p className="text-gray-400 text-sm">
                                {conversations?.total || 0} konuşma
                            </p>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading && !conversations && (
                                <div className="p-4">
                                    <div className="animate-pulse space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex space-x-3 p-3">
                                                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                                                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 text-center">
                                    <div className="text-4xl mb-2">⚠️</div>
                                    <p className="text-gray-400 text-sm">{error}</p>
                                </div>
                            )}

                            {conversations?.conversations.length === 0 && !loading && (
                                <div className="p-8 text-center">
                                    <div className="text-6xl mb-4">💬</div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Henüz mesaj yok</h3>
                                    <p className="text-gray-400 text-sm">
                                        Arkadaşlarınızla sohbet etmeye başlayın!
                                    </p>
                                </div>
                            )}

                            {conversations?.conversations.map((conversation) => {
                                const otherParticipant = getOtherParticipant(conversation);
                                const isSelected = conversation.id === currentConversationId;

                                return (
                                    <div
                                        key={conversation.id}
                                        onClick={() => handleSelectConversation(conversation.id)}
                                        className={`p-4 cursor-pointer hover:bg-white/5 transition-colors duration-200 border-l-4 ${isSelected
                                            ? 'bg-[#5865f2]/10 border-[#5865f2]'
                                            : 'border-transparent'
                                            }`}
                                    >
                                        <div className="flex space-x-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full overflow-hidden">
                                                    <Image
                                                        src={otherParticipant?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                                        alt={otherParticipant?.displayName || 'User'}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                {otherParticipant?.isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#2f3136]"></div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className={`font-semibold truncate ${isSelected ? 'text-[#5865f2]' : 'text-white'
                                                        }`}>
                                                        {otherParticipant?.displayName || 'Unknown User'}
                                                    </h3>
                                                    {conversation.lastMessage && (
                                                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                            {formatLastMessageTime(conversation.lastMessage.timestamp)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-gray-400 truncate">
                                                        {conversation.lastMessage?.senderId === session.user.id && 'Sen: '}
                                                        {conversation.lastMessage?.content || 'Henüz mesaj yok'}
                                                    </p>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="bg-[#5865f2] text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
                                                            {conversation.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {!currentConversationId ? (
                            // No conversation selected
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-8xl mb-6">💬</div>
                                    <h2 className="text-2xl font-bold text-white mb-4">Bir konuşma seçin</h2>
                                    <p className="text-gray-400">
                                        Soldaki listeden mesajlaşmaya başlamak istediğiniz kişiyi seçin.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-6 border-b border-white/10 bg-[#36393f]">
                                    {(() => {
                                        const conversation = conversations?.conversations.find(c => c.id === currentConversationId);
                                        const otherParticipant = conversation ? getOtherParticipant(conversation) : null;

                                        return (
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden">
                                                        <Image
                                                            src={otherParticipant?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                                            alt={otherParticipant?.displayName || 'User'}
                                                            width={48}
                                                            height={48}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    {otherParticipant?.isOnline && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#36393f]"></div>
                                                    )}
                                                </div>

                                                <div>
                                                    <h2 className="text-xl font-bold text-white">
                                                        {otherParticipant?.displayName || 'Unknown User'}
                                                    </h2>
                                                    <p className="text-sm text-gray-400">
                                                        {otherParticipant?.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {currentMessages?.messages.map((message) => {
                                        const isOwnMessage = message.senderId === session.user.id;

                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`flex space-x-3 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                    {!isOwnMessage && (
                                                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                                            <Image
                                                                src={message.senderInfo.avatar}
                                                                alt={message.senderInfo.displayName}
                                                                width={32}
                                                                height={32}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className={`rounded-lg p-3 ${isOwnMessage
                                                        ? 'bg-[#5865f2] text-white'
                                                        : 'bg-[#36393f] text-white'
                                                        }`}>
                                                        <p className="text-sm">{message.content}</p>
                                                        <div className={`flex items-center justify-between mt-2 text-xs ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'
                                                            }`}>
                                                            <span>{formatMessageTime(message.timestamp)}</span>
                                                            {isOwnMessage && (
                                                                <span className="ml-2">
                                                                    {message.status === 'sending' && '⏳'}
                                                                    {message.status === 'sent' && '✓'}
                                                                    {message.status === 'delivered' && '✓✓'}
                                                                    {message.status === 'read' && '👁️'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-6 border-t border-white/10 bg-[#36393f]">
                                    <form onSubmit={handleSendMessage} className="flex space-x-4">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Mesajınızı yazın..."
                                            disabled={isSubmitting}
                                            className="flex-1 bg-[#2f3136] text-white rounded-lg px-4 py-3 border border-white/10 focus:border-[#5865f2] focus:outline-none disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || isSubmitting}
                                            className="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                'Gönder'
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
} 