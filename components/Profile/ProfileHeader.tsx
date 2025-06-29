"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useProfile } from '@/lib/hooks/useProfile';

interface ProfileHeaderProps {
    user: {
        id: string;
        username: string;
        displayName: string;
        avatar: string;
        banner: string;
        isOnline: boolean;
        level: number;
        status: string;
        location: string;
        bio: string;
        joinedAt: string;
        lastSeen: string;
        roles: string[];
        highestRole: string;
        permissions?: string[];
    };
    isOwnProfile?: boolean;
    onEditClick?: () => void;
}

export default function ProfileHeader({ user, isOwnProfile = false, onEditClick }: ProfileHeaderProps) {
    const [imageError, setImageError] = useState(false);
    const { discordProfile, loading } = useProfile(user.id);

    // Use Discord profile data if available, fallback to user data
    const profileData = discordProfile?.profile || user;
    const avatar = discordProfile?.profile?.avatar || user.avatar;
    const banner = discordProfile?.profile?.banner || user.banner;
    const displayName = discordProfile?.profile?.globalName || user.displayName;
    const username = discordProfile?.profile?.username || user.username;
    const connections = discordProfile?.connections || [];

    return (
        <div className="relative">
            {/* Banner */}
            <div className="h-80 lg:h-96 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5865f2]/30 to-[#4752c4]/30"></div>
                {banner && !imageError ? (
                    <Image
                        src={banner}
                        alt="Profile Banner"
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4]"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f24] via-transparent to-transparent"></div>
            </div>

            {/* Profile Info */}
            <div className="container mx-auto px-4">
                <div className="relative -mt-20 lg:-mt-24">
                    <div className="flex flex-col lg:flex-row items-start lg:items-end space-y-6 lg:space-y-0 lg:space-x-8">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl overflow-hidden ring-4 ring-[#2f3136] bg-[#2f3136]">
                                {avatar ? (
                                    <Image
                                        src={avatar}
                                        alt={username}
                                        width={160}
                                        height={160}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold text-4xl">
                                        {username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Online Status */}
                            <div className="absolute -bottom-2 -right-2 flex items-center space-x-2 bg-[#2f3136] px-3 py-1 rounded-full border border-white/10">
                                <div className={`w-3 h-3 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}>
                                    {user.isOnline && (
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400">
                                    {user.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                                </span>
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="flex-1 pb-6">
                            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    {/* Name and Level */}
                                    <div className="flex items-center space-x-4 mb-2">
                                        <h1 className="text-3xl lg:text-4xl font-bold text-white">{displayName}</h1>
                                        <div className="bg-gradient-to-r from-[#5865f2] to-[#4752c4] px-3 py-1 rounded-full">
                                            <span className="text-white font-bold text-sm">Lv.{user.level}</span>
                                        </div>
                                        {discordProfile?.profile?.premiumType && (
                                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full">
                                                <span className="text-white font-bold text-sm">NITRO</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Username */}
                                    <p className="text-lg text-gray-400 mb-3">@{username}</p>

                                    {/* Gaming Connections */}
                                    {connections.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {connections.map((connection, index) => {
                                                // Gaming platform icons and colors
                                                const getConnectionIcon = (type: string) => {
                                                    switch (type.toLowerCase()) {
                                                        case 'steam': return { icon: '🎮', color: 'from-blue-600 to-blue-800' };
                                                        case 'xbox': return { icon: '🎯', color: 'from-green-600 to-green-800' };
                                                        case 'playstation': return { icon: '🎮', color: 'from-blue-500 to-blue-700' };
                                                        case 'riotgames': return { icon: '⚔️', color: 'from-red-600 to-red-800' };
                                                        case 'leagueoflegends': return { icon: '🏆', color: 'from-yellow-600 to-yellow-800' };
                                                        case 'epicgames': return { icon: '🚀', color: 'from-purple-600 to-purple-800' };
                                                        case 'battlenet': return { icon: '⚡', color: 'from-blue-400 to-blue-600' };
                                                        case 'spotify': return { icon: '🎵', color: 'from-green-500 to-green-700' };
                                                        case 'youtube': return { icon: '📺', color: 'from-red-500 to-red-700' };
                                                        case 'twitch': return { icon: '📺', color: 'from-purple-500 to-purple-700' };
                                                        case 'github': return { icon: '💻', color: 'from-gray-600 to-gray-800' };
                                                        default: return { icon: '🔗', color: 'from-gray-600 to-gray-800' };
                                                    }
                                                };

                                                const connectionData = getConnectionIcon(connection.type);
                                                const isGaming = ['steam', 'xbox', 'playstation', 'riotgames', 'leagueoflegends', 'epicgames', 'battlenet'].includes(connection.type.toLowerCase());

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex items-center space-x-2 px-3 py-1 rounded-full border border-white/10 ${isGaming
                                                            ? `bg-gradient-to-r ${connectionData.color} text-white`
                                                            : 'bg-[#36393f] text-gray-300'
                                                            }`}
                                                    >
                                                        <div className="w-4 h-4">
                                                            {connectionData.icon}
                                                        </div>
                                                        <span className="text-sm font-medium">{connection.name}</span>
                                                        {connection.verified && (
                                                            <div className="w-3 h-3 text-green-400">✓</div>
                                                        )}
                                                        {isGaming && connection.showActivity && (
                                                            <div className="w-3 h-3 text-blue-300">📊</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Status */}
                                    <div className="flex items-center space-x-2 mb-3">
                                        <div className="w-2 h-2 bg-[#5865f2] rounded-full"></div>
                                        <span className="text-gray-300">{user.status}</span>
                                    </div>

                                    {/* Bio */}
                                    <p className="text-gray-300 max-w-2xl mb-4">{user.bio}</p>

                                    {/* Roles */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {user.roles.slice(0, 4).map((role, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-[#36393f] text-gray-300 rounded-full text-sm border border-white/10"
                                            >
                                                {role}
                                            </span>
                                        ))}
                                        {user.roles.length > 4 && (
                                            <span className="px-3 py-1 bg-[#5865f2]/20 text-[#5865f2] rounded-full text-sm border border-[#5865f2]/30">
                                                +{user.roles.length - 4} daha
                                            </span>
                                        )}
                                    </div>

                                    {/* Location and Join Date */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-400">
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{user.location}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Katılım: {new Date(user.joinedAt).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {!isOwnProfile && (
                                    <div className="flex space-x-3 mt-6 lg:mt-0">
                                        <button className="px-6 py-3 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-all duration-300 font-medium">
                                            Mesaj Gönder
                                        </button>
                                        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-medium">
                                            Arkadaş Ekle
                                        </button>
                                        <button className="px-6 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-all duration-300 font-medium">
                                            Rapor Et
                                        </button>
                                        <button className="p-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-all duration-300">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                                {isOwnProfile && (
                                    <div className="flex space-x-3 mt-6 lg:mt-0">
                                        <button
                                            onClick={onEditClick}
                                            className="px-6 py-3 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-all duration-300 font-medium"
                                        >
                                            Profili Düzenle
                                        </button>
                                        <button className="px-6 py-3 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-all duration-300 font-medium">
                                            Ayarlar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 