"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthContext';
import { 
    Users, 
    Search, 
    Filter, 
    Crown, 
    Shield, 
    Star, 
    Calendar, 
    Clock, 
    MessageCircle, 
    Mic, 
    Trophy, 
    Award,
    Eye,
    EyeOff,
    ChevronDown
} from 'lucide-react';

interface Member {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    displayName?: string;
    avatar: string;
    banner?: string;
    email?: string;
    roles: string[];
    permissions: string[];
    isOnline: boolean;
    status: 'online' | 'idle' | 'dnd' | 'offline';
    customStatus?: string;
    joinedAt: number;
    lastSeen: number;
    level: number;
    xp: number;
    badges: string[];
    stats: {
        messagesCount: number;
        voiceTimeMinutes: number;
        gamesPlayed: number;
        achievementsCount: number;
    };
    connections?: Array<{
        type: string;
        name: string;
        verified: boolean;
    }>;
    isPublic: boolean;
}

interface MembersResponse {
    members: Member[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    filters: {
        role: string;
        status: string;
        search: string;
    };
    stats: {
        totalMembers: number;
        onlineMembers: number;
        roleDistribution: Record<string, number>;
    };
}

export default function MembersPage() {
    const { user, isAuthenticated } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [stats, setStats] = useState({
        totalMembers: 0,
        onlineMembers: 0,
        roleDistribution: {} as Record<string, number>
    });
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [sortBy, setSortBy] = useState('joinedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const roleColors = {
        admin: 'bg-red-500/20 text-red-400 border-red-500/30',
        founder: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        moderator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        vip: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        support: 'bg-green-500/20 text-green-400 border-green-500/30',
        helper: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        content_creator: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        game_admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        member: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };

    const badgeIcons = {
        founder: <Crown className="w-3 h-3" />,
        admin: <Shield className="w-3 h-3" />,
        moderator: <Shield className="w-3 h-3" />,
        early_supporter: <Star className="w-3 h-3" />,
        top_contributor: <Trophy className="w-3 h-3" />,
        content_creator: <Award className="w-3 h-3" />,
        tournament_organizer: <Trophy className="w-3 h-3" />,
        top_gamer: <Trophy className="w-3 h-3" />,
        skilled_player: <Award className="w-3 h-3" />,
        active_member: <Star className="w-3 h-3" />,
        helper: <Users className="w-3 h-3" />,
        tech_expert: <Award className="w-3 h-3" />,
        reliable: <Star className="w-3 h-3" />,
        newcomer: <Users className="w-3 h-3" />,
        friendly: <Star className="w-3 h-3" />
    };

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                sortBy,
                sortOrder
            });

            if (searchQuery) {
                params.append('search', searchQuery);
            }

            if (selectedRole !== 'all') {
                params.append('role', selectedRole);
            }

            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }

            const response = await fetch(`/api/members?${params}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch members');
            }

            const data: MembersResponse = await response.json();
            setMembers(data.members);
            setStats(data.stats);
            setTotalPages(data.pagination.totalPages);
            
            console.log('👥 [Members] Loaded:', data.members.length, 'members');
        } catch (error) {
            console.error('💥 [Members] Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [currentPage, selectedRole, selectedStatus, sortBy, sortOrder]);

    // Debounced search
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (currentPage === 1) {
                fetchMembers();
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const getStatusColor = (status: string, isOnline: boolean) => {
        if (!isOnline) return 'bg-gray-500';
        
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'idle': return 'bg-yellow-500';
            case 'dnd': return 'bg-red-500';
            case 'offline': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}g ${hours % 24}s`;
        }
        
        return `${hours}s ${remainingMinutes}dk`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#36393f] py-8">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-600 rounded w-1/4 mb-6"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="bg-[#2f3136] rounded-xl p-6 border border-white/10">
                                    <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4"></div>
                                    <div className="h-4 bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
                                    <div className="h-3 bg-gray-600 rounded w-1/2 mx-auto"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#36393f] py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
                            <Users className="text-[#5865f2]" size={40} />
                            <span>Üyeler</span>
                        </h1>
                        <p className="text-gray-400">PRV10 topluluğunun aktif üyeleri</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{stats.totalMembers}</div>
                            <div className="text-gray-400">Toplam Üye</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{stats.onlineMembers}</div>
                            <div className="text-gray-400">Çevrimiçi</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                        {/* Search */}
                        <div className="relative flex-1 lg:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Üye ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#36393f] border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#5865f2]"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Role Filter */}
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="px-3 py-2 bg-[#36393f] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#5865f2]"
                            >
                                <option value="all">Tüm Roller</option>
                                {Object.keys(stats.roleDistribution).map(role => (
                                    <option key={role} value={role}>
                                        {role} ({stats.roleDistribution[role]})
                                    </option>
                                ))}
                            </select>

                            {/* Status Filter */}
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 bg-[#36393f] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#5865f2]"
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="online">Çevrimiçi</option>
                                <option value="idle">Boşta</option>
                                <option value="dnd">Rahatsız Etmeyin</option>
                                <option value="offline">Çevrimdışı</option>
                            </select>

                            {/* Sort */}
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                                    setSortBy(newSortBy);
                                    setSortOrder(newSortOrder);
                                }}
                                className="px-3 py-2 bg-[#36393f] border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#5865f2]"
                            >
                                <option value="joinedAt-desc">En Yeni Üyeler</option>
                                <option value="joinedAt-asc">En Eski Üyeler</option>
                                <option value="level-desc">En Yüksek Level</option>
                                <option value="level-asc">En Düşük Level</option>
                                <option value="activity-desc">En Son Aktif</option>
                                <option value="messages-desc">En Çok Mesaj</option>
                            </select>

                            {/* View Mode */}
                            <div className="flex items-center bg-[#36393f] rounded-lg border border-white/20">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-3 py-2 rounded-l-lg transition-colors ${
                                        viewMode === 'grid' ? 'bg-[#5865f2] text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-2 rounded-r-lg transition-colors ${
                                        viewMode === 'list' ? 'bg-[#5865f2] text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    Liste
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members Grid/List */}
                {members.length === 0 ? (
                    <div className="bg-[#2f3136] rounded-xl border border-white/10 p-12 text-center">
                        <Users className="mx-auto text-gray-500 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-white mb-2">Üye Bulunamadı</h3>
                        <p className="text-gray-400">
                            {searchQuery ? 'Arama kriterlerinize uygun üye bulunamadı.' : 'Henüz üye bulunmuyor.'}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {members.map(member => (
                            <Link
                                key={member.id}
                                href={`/profile/${member.id}`}
                                className="bg-[#2f3136] rounded-xl border border-white/10 p-6 hover:border-[#5865f2]/50 transition-all duration-300 hover:scale-105 group"
                            >
                                {/* Avatar */}
                                <div className="relative w-20 h-20 mx-auto mb-4">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-[#5865f2]">
                                        {member.avatar ? (
                                            <img
                                                src={`https://cdn.discordapp.com/avatars/${member.discordId}/${member.avatar}.png?size=256`}
                                                alt={member.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold text-xl">
                                                {member.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Status Indicator */}
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-[#2f3136] ${getStatusColor(member.status, member.isOnline)}`}>
                                        <div className="absolute inset-0 rounded-full animate-ping opacity-75 bg-current"></div>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="text-center mb-4">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-[#5865f2] transition-colors">
                                        {member.displayName || member.username}
                                    </h3>
                                    <p className="text-sm text-gray-400">@{member.username}#{member.discriminator}</p>
                                    
                                    {member.customStatus && (
                                        <p className="text-xs text-gray-500 mt-1 truncate">{member.customStatus}</p>
                                    )}
                                </div>

                                {/* Level & XP */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-400">Level {member.level}</span>
                                        <span className="text-gray-400">{member.xp?.toLocaleString()} XP</span>
                                    </div>
                                    <div className="w-full bg-[#36393f] rounded-full h-2">
                                        <div 
                                            className="bg-[#5865f2] h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${(member.xp % 1000) / 10}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Roles */}
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-1 justify-center">
                                        {member.roles.slice(0, 2).map(role => (
                                            <span
                                                key={role}
                                                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                                    roleColors[role as keyof typeof roleColors] || roleColors.member
                                                }`}
                                            >
                                                {role}
                                            </span>
                                        ))}
                                        {member.roles.length > 2 && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium border bg-gray-500/20 text-gray-400 border-gray-500/30">
                                                +{member.roles.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Badges */}
                                {member.badges.length > 0 && (
                                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                                        {member.badges.slice(0, 3).map(badge => (
                                            <div
                                                key={badge}
                                                className="w-6 h-6 bg-[#36393f] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                                title={badge}
                                            >
                                                {badgeIcons[badge as keyof typeof badgeIcons] || <Award className="w-3 h-3" />}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Stats */}
                                {member.stats && (
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                                        <div className="text-center">
                                            <div className="font-semibold text-white">{member.stats.messagesCount?.toLocaleString()}</div>
                                            <div>Mesaj</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-semibold text-white">{member.stats.gamesPlayed}</div>
                                            <div>Oyun</div>
                                        </div>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#2f3136] rounded-xl border border-white/10 overflow-hidden">
                        <div className="p-4 bg-[#36393f] border-b border-white/10">
                            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400">
                                <div className="col-span-4">Üye</div>
                                <div className="col-span-2">Roller</div>
                                <div className="col-span-2">Level</div>
                                <div className="col-span-2">Mesajlar</div>
                                <div className="col-span-2">Katılım</div>
                            </div>
                        </div>
                        <div className="divide-y divide-white/10">
                            {members.map(member => (
                                <Link
                                    key={member.id}
                                    href={`/profile/${member.id}`}
                                    className="grid grid-cols-12 gap-4 p-4 hover:bg-[#36393f] transition-colors items-center"
                                >
                                    {/* User Info */}
                                    <div className="col-span-4 flex items-center space-x-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#5865f2]">
                                                {member.avatar ? (
                                                    <img
                                                        src={`https://cdn.discordapp.com/avatars/${member.discordId}/${member.avatar}.png?size=128`}
                                                        alt={member.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold">
                                                        {member.username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#2f3136] ${getStatusColor(member.status, member.isOnline)}`}></div>
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{member.displayName || member.username}</div>
                                            <div className="text-sm text-gray-400">@{member.username}#{member.discriminator}</div>
                                        </div>
                                    </div>

                                    {/* Roles */}
                                    <div className="col-span-2">
                                        <div className="flex flex-wrap gap-1">
                                            {member.roles.slice(0, 1).map(role => (
                                                <span
                                                    key={role}
                                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                                        roleColors[role as keyof typeof roleColors] || roleColors.member
                                                    }`}
                                                >
                                                    {role}
                                                </span>
                                            ))}
                                            {member.roles.length > 1 && (
                                                <span className="text-xs text-gray-400">+{member.roles.length - 1}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Level */}
                                    <div className="col-span-2">
                                        <div className="text-white font-medium">Level {member.level}</div>
                                        <div className="text-xs text-gray-400">{member.xp?.toLocaleString()} XP</div>
                                    </div>

                                    {/* Messages */}
                                    <div className="col-span-2">
                                        <div className="text-white font-medium">{member.stats?.messagesCount?.toLocaleString()}</div>
                                        <div className="text-xs text-gray-400">mesaj</div>
                                    </div>

                                    {/* Join Date */}
                                    <div className="col-span-2">
                                        <div className="text-white text-sm">{formatDate(member.joinedAt)}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 mt-8">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-[#36393f] text-gray-300 rounded-lg hover:bg-[#40444b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Önceki
                        </button>
                        
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let page = i + 1;
                                if (totalPages > 5) {
                                    const start = Math.max(1, currentPage - 2);
                                    page = start + i;
                                }
                                
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                            currentPage === page
                                                ? 'bg-[#5865f2] text-white'
                                                : 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-[#36393f] text-gray-300 rounded-lg hover:bg-[#40444b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sonraki
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}