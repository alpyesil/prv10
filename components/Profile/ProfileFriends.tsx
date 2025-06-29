"use client";

import { useProfile } from '@/lib/hooks/useProfile';
import { useMessages } from '@/lib/hooks/useMessages';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useToast } from '@/lib/hooks/use-toast';

interface ProfileFriendsProps {
    userId: string;
}

export default function ProfileFriends({ userId }: ProfileFriendsProps) {
    const { friends, loading, error } = useProfile(userId);
    const { startConversation, registrationError, clearRegistrationError, error: messagesError } = useMessages();
    const router = useRouter();
    const [sendingMessageTo, setSendingMessageTo] = useState<string | null>(null);
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

    // Handle messages error for toast notifications
    useEffect(() => {
        if (messagesError) {
            toast({
                variant: "destructive",
                title: "Mesajlaşma Hatası",
                description: messagesError,
            });
        }
    }, [messagesError, toast]);

    const handleSendMessage = async (friendId: string, friendName: string) => {
        try {
            setSendingMessageTo(friendId);
            console.log('💬 [ProfileFriends] Starting conversation with:', friendId);

            // Start conversation and redirect to messages page
            const conversationId = await startConversation(friendId);

            if (conversationId) {
                console.log('✅ [ProfileFriends] Conversation started, redirecting to messages');
                router.push('/messages');
            } else {
                console.log('⚠️ [ProfileFriends] Failed to start conversation');
            }
        } catch (error) {
            console.error('💥 [ProfileFriends] Error starting conversation:', error);
            toast({
                variant: "destructive",
                title: "Hata",
                description: "Konuşma başlatılırken bir hata oluştu.",
            });
        } finally {
            setSendingMessageTo(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Discord Arkadaşları</h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center space-x-3 p-2">
                            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-700 rounded mb-1"></div>
                                <div className="h-3 bg-gray-700 rounded w-16"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Discord Arkadaşları</h3>
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">⚠️</div>
                    <p className="text-gray-400 text-sm">Arkadaş listesi yüklenirken hata oluştu</p>
                    <p className="text-gray-500 text-xs mt-1">{error}</p>
                </div>
            </div>
        );
    }

    const displayFriends = friends?.friends?.slice(0, 4) || [];
    const onlineFriends = friends?.friends?.filter(f => f.isOnline) || [];

    return (
        <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Discord Arkadaşları</h3>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-400">{onlineFriends.length} çevrimiçi</span>
                </div>
            </div>

            {!friends || displayFriends.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="text-gray-400 text-sm">
                        {friends?.source === 'mock' ? 'Mock arkadaş verisi' : 'Henüz arkadaş bulunamadı'}
                    </p>
                    {friends?.source === 'mock' && (
                        <p className="text-gray-500 text-xs mt-1">Discord Guild Members yükleniyor...</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="space-y-3 mb-4">
                        {displayFriends.map((friend) => (
                            <div
                                key={friend.id}
                                className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-all duration-300"
                                title={`${friend.displayName} - ${friend.roles.join(', ')}`}
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#5865f2]/50 transition-colors duration-300">
                                        <Image
                                            src={friend.avatar}
                                            alt={friend.displayName}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                            unoptimized={friend.avatar.includes('.gif')}
                                        />
                                    </div>
                                    {/* Online Status */}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2f3136] ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'
                                        }`}></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white group-hover:text-[#5865f2] transition-colors duration-300 truncate">
                                        {friend.nickname || friend.displayName}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="text-xs text-gray-400 truncate">
                                            {friend.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                                        </div>
                                        {friend.mutualRoles.length > 0 && (
                                            <>
                                                <span className="text-gray-600">•</span>
                                                <div className="text-xs text-[#5865f2] truncate">
                                                    {friend.mutualRoles[0]}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Friend Actions */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-2">
                                    <button
                                        onClick={() => handleSendMessage(friend.id, friend.displayName)}
                                        disabled={sendingMessageTo === friend.id}
                                        className="p-1.5 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#4752c4] text-white rounded transition-colors duration-200 disabled:cursor-not-allowed"
                                        title="Mesaj Gönder"
                                    >
                                        {sendingMessageTo === friend.id ? (
                                            <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>

                                    <button
                                        className="p-1.5 bg-[#36393f] hover:bg-[#5865f2] text-gray-400 hover:text-white rounded transition-colors duration-200"
                                        title="Arkadaş Ekle"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Show All Friends Link */}
                    <div className="border-t border-white/5 pt-4">
                        <Link
                            href={`/profile/${userId}/friends`}
                            className="block text-center text-[#5865f2] hover:text-[#4752c4] transition-colors duration-300 font-medium"
                        >
                            Tüm Arkadaşları Görüntüle ({friends?.total || 0})
                        </Link>
                        {friends?.source === 'discord' && (
                            <p className="text-center text-xs text-gray-500 mt-1">
                                {friends.guildTotal} guild üyesinden {friends.total} arkadaş
                            </p>
                        )}

                        {/* Quick access to messages */}
                        <div className="mt-3 pt-3 border-t border-white/5">
                            <Link
                                href="/messages"
                                className="block text-center text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                            >
                                💬 Tüm Mesajları Görüntüle
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
} 