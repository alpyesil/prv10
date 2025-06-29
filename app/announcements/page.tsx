"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { Bell, Pin, MessageCircle, Heart, ThumbsUp, Calendar, User, Tag, Filter, Search, Plus } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    author: {
        id: string;
        name: string;
        avatar: string;
    };
    type: 'general' | 'event' | 'maintenance' | 'update' | 'important';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    pinned: boolean;
    tags: string[];
    createdAt: number;
    updatedAt: number;
    readBy: string[];
    reactions: {
        [emoji: string]: string[];
    };
    commentsCount: number;
    isVisible: boolean;
}

interface AnnouncementsResponse {
    announcements: Announcement[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    filters: {
        type: string;
        pinned: boolean;
    };
}

export default function AnnouncementsPage() {
    const { user, isAuthenticated } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [showPinnedOnly, setShowPinnedOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const typeOptions = [
        { value: 'all', label: 'Tümü', icon: '📋', color: 'bg-gray-500' },
        { value: 'general', label: 'Genel', icon: '📄', color: 'bg-blue-500' },
        { value: 'event', label: 'Etkinlik', icon: '🎉', color: 'bg-purple-500' },
        { value: 'maintenance', label: 'Bakım', icon: '🔧', color: 'bg-orange-500' },
        { value: 'update', label: 'Güncelleme', icon: '🆕', color: 'bg-green-500' },
        { value: 'important', label: 'Önemli', icon: '⚠️', color: 'bg-red-500' }
    ];

    const priorityColors = {
        low: 'border-green-500/30 bg-green-500/10',
        medium: 'border-blue-500/30 bg-blue-500/10',
        high: 'border-orange-500/30 bg-orange-500/10',
        urgent: 'border-red-500/30 bg-red-500/10'
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10'
            });

            if (selectedType !== 'all') {
                params.append('type', selectedType);
            }

            if (showPinnedOnly) {
                params.append('pinned', 'true');
            }

            const response = await fetch(`/api/announcements?${params}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch announcements');
            }

            const data: AnnouncementsResponse = await response.json();
            setAnnouncements(data.announcements);
            setTotalPages(data.pagination.totalPages);
            
            console.log('📢 [Announcements] Loaded:', data.announcements.length, 'announcements');
        } catch (error) {
            console.error('💥 [Announcements] Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [currentPage, selectedType, showPinnedOnly]);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes} dakika önce`;
        } else if (hours < 24) {
            return `${hours} saat önce`;
        } else if (days < 7) {
            return `${days} gün önce`;
        } else {
            return date.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    };

    const getTypeInfo = (type: string) => {
        return typeOptions.find(option => option.value === type) || typeOptions[0];
    };

    const filteredAnnouncements = announcements.filter(announcement =>
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#36393f] py-8">
                <div className="container mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-600 rounded w-1/4 mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="bg-[#2f3136] rounded-xl p-6 border border-white/10">
                                    <div className="h-6 bg-gray-600 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-600 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-gray-600 rounded w-2/3"></div>
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
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
                            <Bell className="text-[#5865f2]" size={40} />
                            <span>Duyurular</span>
                        </h1>
                        <p className="text-gray-400">PRV10 topluluğundan en son haberler ve duyurular</p>
                    </div>
                    
                    {/* Create Announcement Button (Admin/Moderator only) */}
                    {isAuthenticated && user?.roles?.some(role => 
                        ['admin', 'moderator', 'announcement_manager'].includes(role.toLowerCase())
                    ) && (
                        <button className="flex items-center space-x-2 px-4 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors duration-300">
                            <Plus size={20} />
                            <span>Yeni Duyuru</span>
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* Search */}
                        <div className="relative flex-1 lg:max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Duyuru ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#36393f] border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#5865f2]"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="flex flex-wrap gap-2">
                            {typeOptions.map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setSelectedType(type.value)}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                        selectedType === type.value
                                            ? `${type.color} text-white`
                                            : 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]'
                                    }`}
                                >
                                    <span>{type.icon}</span>
                                    <span>{type.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Pinned Filter */}
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showPinnedOnly}
                                onChange={(e) => setShowPinnedOnly(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                showPinnedOnly ? 'bg-[#5865f2] border-[#5865f2]' : 'border-gray-400'
                            }`}>
                                {showPinnedOnly && <Pin className="text-white" size={12} />}
                            </div>
                            <span className="text-gray-300 text-sm">Sadece Sabitlenmiş</span>
                        </label>
                    </div>
                </div>

                {/* Announcements List */}
                <div className="space-y-6">
                    {filteredAnnouncements.length === 0 ? (
                        <div className="bg-[#2f3136] rounded-xl border border-white/10 p-12 text-center">
                            <Bell className="mx-auto text-gray-500 mb-4" size={48} />
                            <h3 className="text-xl font-semibold text-white mb-2">Duyuru Bulunamadı</h3>
                            <p className="text-gray-400">
                                {searchQuery ? 'Arama kriterlerinize uygun duyuru bulunamadı.' : 'Henüz duyuru bulunmuyor.'}
                            </p>
                        </div>
                    ) : (
                        filteredAnnouncements.map(announcement => {
                            const typeInfo = getTypeInfo(announcement.type);
                            
                            return (
                                <div
                                    key={announcement.id}
                                    className={`bg-[#2f3136] rounded-xl border transition-all duration-300 hover:border-[#5865f2]/50 ${
                                        priorityColors[announcement.priority]
                                    } ${announcement.pinned ? 'ring-2 ring-yellow-500/30' : 'border-white/10'}`}
                                >
                                    {announcement.pinned && (
                                        <div className="flex items-center space-x-2 px-6 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
                                            <Pin className="text-yellow-500" size={16} />
                                            <span className="text-yellow-500 text-sm font-medium">Sabitlenmiş Duyuru</span>
                                        </div>
                                    )}
                                    
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color} text-white`}>
                                                        {typeInfo.icon} {typeInfo.label}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        announcement.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                                                        announcement.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                        announcement.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {announcement.priority.toUpperCase()}
                                                    </span>
                                                </div>
                                                <h2 className="text-xl font-bold text-white mb-2">{announcement.title}</h2>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="text-gray-300 mb-4 leading-relaxed">
                                            {announcement.content}
                                        </div>

                                        {/* Tags */}
                                        {announcement.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {announcement.tags.map(tag => (
                                                    <span key={tag} className="flex items-center space-x-1 px-2 py-1 bg-[#36393f] text-gray-400 text-xs rounded-full">
                                                        <Tag size={12} />
                                                        <span>{tag}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <div className="flex items-center space-x-4">
                                                {/* Author */}
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center">
                                                        {announcement.author.avatar ? (
                                                            <img 
                                                                src={announcement.author.avatar} 
                                                                alt={announcement.author.name}
                                                                className="w-full h-full rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="text-white" size={16} />
                                                        )}
                                                    </div>
                                                    <span className="text-gray-400 text-sm">{announcement.author.name}</span>
                                                </div>

                                                {/* Date */}
                                                <div className="flex items-center space-x-1 text-gray-400 text-sm">
                                                    <Calendar size={14} />
                                                    <span>{formatDate(announcement.createdAt)}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center space-x-4">
                                                {/* Reactions */}
                                                <div className="flex items-center space-x-2">
                                                    <button className="flex items-center space-x-1 px-2 py-1 bg-[#36393f] rounded-full hover:bg-[#40444b] transition-colors">
                                                        <Heart className="text-red-400" size={14} />
                                                        <span className="text-gray-400 text-xs">
                                                            {Object.values(announcement.reactions).flat().length}
                                                        </span>
                                                    </button>
                                                </div>

                                                {/* Comments */}
                                                <button className="flex items-center space-x-1 px-2 py-1 bg-[#36393f] rounded-full hover:bg-[#40444b] transition-colors">
                                                    <MessageCircle className="text-blue-400" size={14} />
                                                    <span className="text-gray-400 text-xs">{announcement.commentsCount}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

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
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                            ))}
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