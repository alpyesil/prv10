"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';
import { useProfile } from '@/lib/hooks/useProfile';
import { useMessages } from '@/lib/hooks/useMessages';

interface Friend {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    nickname?: string;
    roles: string[];
    joinedAt: string;
    isOnline: boolean;
    mutualRoles: string[];
}

export default function FriendsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;
    const { friends, loading, error } = useProfile(userId);
    const { startConversation } = useMessages();

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'status' | 'joinDate' | 'mutualRoles'>('status');
    const [sendingMessageTo, setSendingMessageTo] = useState<string | null>(null);

    const handleSendMessage = async (friendId: string, friendName: string) => {
        try {
            setSendingMessageTo(friendId);
            console.log('💬 [FriendsPage] Starting conversation with:', friendId, friendName);

            // Start conversation and redirect to messages page
            const conversationId = await startConversation(friendId);

            if (conversationId) {
                console.log('✅ [FriendsPage] Conversation started, redirecting to messages');
                router.push('/messages');
            } else {
                console.log('⚠️ [FriendsPage] Failed to start conversation');
            }
        } catch (error) {
            console.error('💥 [FriendsPage] Error starting conversation:', error);
        } finally {
            setSendingMessageTo(null);
        }
    };

    // Filter ve sort işlemleri
    const filteredFriends = friends?.friends?.filter((friend: Friend) => {
        const matchesSearch = friend.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (friend.nickname?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || friend.roles.includes(roleFilter);
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'online' && friend.isOnline) ||
            (statusFilter === 'offline' && !friend.isOnline);

        return matchesSearch && matchesRole && matchesStatus;
    }) || [];

    const sortedFriends = [...filteredFriends].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.displayName.localeCompare(b.displayName);
            case 'status':
                if (a.isOnline && !b.isOnline) return -1;
                if (!a.isOnline && b.isOnline) return 1;
                return a.displayName.localeCompare(b.displayName);
            case 'joinDate':
                return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
            case 'mutualRoles':
                return b.mutualRoles.length - a.mutualRoles.length;
            default:
                return 0;
        }
    });

    // Tüm roller listesi
    const allRoles = Array.from(new Set(friends?.friends?.flatMap((f: Friend) => f.roles) || []));

    const formatJoinDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-gradient-to-br from-[#1e1f24] via-[#2a2d31] to-[#36393f] pt-8">
                    <div className="container mx-auto px-4">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-700 rounded mb-6 max-w-md"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                    <div key={i} className="bg-[#2f3136] rounded-xl p-6 border border-white/10">
                                        <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4"></div>
                                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                                        <div className="h-3 bg-gray-700 rounded mb-3 max-w-24 mx-auto"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-[#1e1f24] via-[#2a2d31] to-[#36393f] pt-8">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center space-x-4 mb-6">
                            <Link
                                href={`/profile/${userId}`}
                                className="p-2 bg-[#36393f] hover:bg-[#5865f2] text-gray-400 hover:text-white rounded-lg transition-colors duration-200"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </Link>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white">Discord Arkadaşları</h1>
                                <p className="text-gray-400">
                                    {friends?.source === 'discord' && (
                                        <>Toplam {friends.guildTotal} guild üyesinden {friends.total} arkadaş</>
                                    )}
                                    {friends?.source === 'mock' && 'Mock arkadaş verisi görüntüleniyor'}
                                </p>
                            </div>
                            <Link
                                href="/messages"
                                className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium rounded-lg transition-colors duration-200"
                            >
                                💬 Mesajlar
                            </Link>
                        </div>

                        {/* Filters */}
                        <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Ara</label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="İsim veya kullanıcı adı..."
                                        className="w-full bg-[#36393f] text-white rounded-lg px-3 py-2 border border-white/10 focus:border-[#5865f2] focus:outline-none"
                                    />
                                </div>

                                {/* Role Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Rol</label>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="w-full bg-[#36393f] text-white rounded-lg px-3 py-2 border border-white/10 focus:border-[#5865f2] focus:outline-none"
                                    >
                                        <option value="all">Tüm Roller</option>
                                        {allRoles.map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Durum</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="w-full bg-[#36393f] text-white rounded-lg px-3 py-2 border border-white/10 focus:border-[#5865f2] focus:outline-none"
                                    >
                                        <option value="all">Tümü</option>
                                        <option value="online">Çevrimiçi</option>
                                        <option value="offline">Çevrimdışı</option>
                                    </select>
                                </div>

                                {/* Sort */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Sırala</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="w-full bg-[#36393f] text-white rounded-lg px-3 py-2 border border-white/10 focus:border-[#5865f2] focus:outline-none"
                                    >
                                        <option value="status">Durum</option>
                                        <option value="name">İsim</option>
                                        <option value="joinDate">Katılma Tarihi</option>
                                        <option value="mutualRoles">Ortak Roller</option>
                                    </select>
                                </div>
                            </div>

                            {/* Results Count */}
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between text-sm text-gray-400">
                                    <span>{sortedFriends.length} arkadaş gösteriliyor</span>
                                    <div className="flex items-center space-x-4">
                                        <span>
                                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></span>
                                            {sortedFriends.filter(f => f.isOnline).length} çevrimiçi
                                        </span>
                                        <span>
                                            <span className="w-2 h-2 bg-gray-500 rounded-full inline-block mr-1"></span>
                                            {sortedFriends.filter(f => !f.isOnline).length} çevrimdışı
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Friends Grid */}
                    {sortedFriends.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold text-white mb-2">Arkadaş bulunamadı</h3>
                            <p className="text-gray-400">Arama kriterlerinizi değiştirmeyi deneyin.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                            {sortedFriends.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="group bg-[#2f3136] rounded-xl border border-white/10 p-6 hover:border-[#5865f2]/50 transition-all duration-300 hover:transform hover:-translate-y-1"
                                >
                                    {/* Avatar & Status */}
                                    <div className="relative mb-4">
                                        <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-white/10 group-hover:border-[#5865f2]/50 transition-colors duration-300">
                                            <Image
                                                src={friend.avatar}
                                                alt={friend.displayName}
                                                width={80}
                                                height={80}
                                                className="w-full h-full object-cover"
                                                unoptimized={friend.avatar.includes('.gif')}
                                            />
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#2f3136] ${friend.isOnline ? 'bg-green-500' : 'bg-gray-500'
                                            }`}></div>
                                    </div>

                                    {/* Friend Info */}
                                    <div className="text-center mb-4">
                                        <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-[#5865f2] transition-colors duration-300">
                                            {friend.nickname || friend.displayName}
                                        </h3>
                                        <p className="text-gray-400 text-sm mb-2">@{friend.username}</p>
                                        <p className="text-xs text-gray-500">
                                            Katıldı: {formatJoinDate(friend.joinedAt)}
                                        </p>
                                    </div>

                                    {/* Roles */}
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                            {friend.roles.slice(0, 3).map((role, index) => (
                                                <span
                                                    key={index}
                                                    className={`px-2 py-1 text-xs rounded-full font-medium ${friend.mutualRoles.includes(role)
                                                        ? 'bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/30'
                                                        : 'bg-[#36393f] text-gray-400 border border-white/10'
                                                        }`}
                                                >
                                                    {role}
                                                </span>
                                            ))}
                                            {friend.roles.length > 3 && (
                                                <span className="px-2 py-1 text-xs rounded-full bg-[#36393f] text-gray-400 border border-white/10">
                                                    +{friend.roles.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleSendMessage(friend.id, friend.displayName)}
                                            disabled={sendingMessageTo === friend.id}
                                            className="flex-1 bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:cursor-not-allowed"
                                        >
                                            {sendingMessageTo === friend.id ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Başlatılıyor...
                                                </div>
                                            ) : (
                                                '💬 Mesaj Gönder'
                                            )}
                                        </button>
                                        <button className="p-2 bg-[#36393f] hover:bg-[#5865f2] text-gray-400 hover:text-white rounded-lg transition-colors duration-200">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
} 