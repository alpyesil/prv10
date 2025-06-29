"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Users, 
    Bell, 
    Shield, 
    BarChart3, 
    Activity, 
    MessageSquare, 
    Gamepad2,
    Server,
    Database,
    Clock,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Settings,
    Crown,
    Sword
} from 'lucide-react';

interface AdminStats {
    users: {
        total: number;
        online: number;
        newThisWeek: number;
        newThisMonth: number;
        roleDistribution: Record<string, number>;
    };
    announcements: {
        total: number;
        published: number;
        pinned: number;
        thisWeek: number;
        byType: Record<string, number>;
    };
    clans: {
        total: number;
        active: number;
        membersTotal: number;
        averageMembersPerClan: number;
    };
    activity: {
        messagesThisWeek: number;
        voiceTimeThisWeek: number;
        gamesPlayedThisWeek: number;
        activeUsersThisWeek: number;
    };
    system: {
        serverUptime: number;
        lastBackup: number;
        storageUsed: number;
        apiRequestsToday: number;
    };
}

export default function AdminDashboard() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check admin permissions
    const isAdmin = isAuthenticated && user?.roles?.some(role => 
        ['admin', 'super_admin'].includes(role.toLowerCase())
    );

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/');
            return;
        }

        if (!loading && isAuthenticated && !isAdmin) {
            router.push('/');
            return;
        }
    }, [loading, isAuthenticated, isAdmin, router]);

    useEffect(() => {
        if (isAdmin) {
            fetchStats();
        }
    }, [isAdmin]);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const response = await fetch('/api/admin/stats');
            
            if (!response.ok) {
                throw new Error('Failed to fetch admin stats');
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching admin stats:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setStatsLoading(false);
        }
    };

    const formatUptime = (milliseconds: number) => {
        const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
        const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return `${days}g ${hours}s`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('tr-TR');
    };

    if (loading || !isAuthenticated || !isAdmin) {
        return (
            <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#5865f2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Yetki kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#36393f] py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
                            <Shield className="text-red-500" size={40} />
                            <span>Admin Panel</span>
                        </h1>
                        <p className="text-gray-400">PRV10 topluluğu yönetim paneli</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-400">Sistem Aktif</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link href="/admin/users" className="bg-[#2f3136] rounded-xl border border-white/10 p-6 hover:border-[#5865f2]/50 transition-all duration-300 hover:scale-105 group">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                <Users className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">Üye Yönetimi</h3>
                                <p className="text-gray-400 text-sm">Kullanıcıları yönet</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/announcements" className="bg-[#2f3136] rounded-xl border border-white/10 p-6 hover:border-[#5865f2]/50 transition-all duration-300 hover:scale-105 group">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                                <Bell className="text-green-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">Duyurular</h3>
                                <p className="text-gray-400 text-sm">Duyuru yönetimi</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/clans" className="bg-[#2f3136] rounded-xl border border-white/10 p-6 hover:border-[#5865f2]/50 transition-all duration-300 hover:scale-105 group">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                                <Sword className="text-purple-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">Klan Yönetimi</h3>
                                <p className="text-gray-400 text-sm">Klanları yönet</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/admin/settings" className="bg-[#2f3136] rounded-xl border border-white/10 p-6 hover:border-[#5865f2]/50 transition-all duration-300 hover:scale-105 group">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                                <Settings className="text-orange-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors">Ayarlar</h3>
                                <p className="text-gray-400 text-sm">Sistem ayarları</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Statistics */}
                {statsLoading ? (
                    <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-600 rounded w-1/4 mb-6"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-[#36393f] rounded-lg p-4">
                                        <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                                        <div className="h-8 bg-gray-600 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                        <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-red-400 mb-2">İstatistikler Yüklenemedi</h3>
                        <p className="text-gray-400 mb-4">{error}</p>
                        <button 
                            onClick={fetchStats}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                ) : stats ? (
                    <>
                        {/* User Statistics */}
                        <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6 mb-6">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                                <Users className="text-blue-400" size={24} />
                                <span>Kullanıcı İstatistikleri</span>
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-[#36393f] rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Toplam Üye</span>
                                        <Users className="text-blue-400" size={16} />
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.users.total.toLocaleString()}</div>
                                    <div className="text-xs text-green-400 flex items-center space-x-1">
                                        <TrendingUp size={12} />
                                        <span>+{stats.users.newThisWeek} bu hafta</span>
                                    </div>
                                </div>

                                <div className="bg-[#36393f] rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Çevrimiçi</span>
                                        <Activity className="text-green-400" size={16} />
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.users.online.toLocaleString()}</div>
                                    <div className="text-xs text-gray-400">
                                        %{Math.round((stats.users.online / stats.users.total) * 100)} aktif
                                    </div>
                                </div>

                                <div className="bg-[#36393f] rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">Yeni Üyeler</span>
                                        <TrendingUp className="text-purple-400" size={16} />
                                    </div>
                                    <div className="text-2xl font-bold text-white">{stats.users.newThisMonth.toLocaleString()}</div>
                                    <div className="text-xs text-gray-400">Bu ay katılan</div>
                                </div>

                                <div className="bg-[#36393f] rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-400 text-sm">En Çok Rol</span>
                                        <Crown className="text-yellow-400" size={16} />
                                    </div>
                                    <div className="text-lg font-bold text-white">
                                        {Object.entries(stats.users.roleDistribution)
                                            .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {Object.entries(stats.users.roleDistribution)
                                            .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[1] || 0} kişi
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Statistics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                                    <Activity className="text-green-400" size={20} />
                                    <span>Haftalık Aktivite</span>
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <MessageSquare className="text-blue-400" size={16} />
                                            <span className="text-gray-400">Mesajlar</span>
                                        </div>
                                        <span className="text-white font-semibold">{stats.activity.messagesThisWeek.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Gamepad2 className="text-purple-400" size={16} />
                                            <span className="text-gray-400">Oyun Oturumu</span>
                                        </div>
                                        <span className="text-white font-semibold">{stats.activity.gamesPlayedThisWeek.toLocaleString()}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Users className="text-orange-400" size={16} />
                                            <span className="text-gray-400">Aktif Kullanıcı</span>
                                        </div>
                                        <span className="text-white font-semibold">{stats.activity.activeUsersThisWeek.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                                    <BarChart3 className="text-yellow-400" size={20} />
                                    <span>İçerik İstatistikleri</span>
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Bell className="text-green-400" size={16} />
                                            <span className="text-gray-400">Duyurular</span>
                                        </div>
                                        <span className="text-white font-semibold">{stats.announcements.total}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Sword className="text-purple-400" size={16} />
                                            <span className="text-gray-400">Aktif Klanlar</span>
                                        </div>
                                        <span className="text-white font-semibold">{stats.clans.active}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Users className="text-blue-400" size={16} />
                                            <span className="text-gray-400">Klan Üyeleri</span>
                                        </div>
                                        <span className="text-white font-semibold">{stats.clans.membersTotal}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                                <Server className="text-blue-400" size={20} />
                                <span>Sistem Durumu</span>
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <CheckCircle className="text-green-400" size={24} />
                                    </div>
                                    <div className="text-sm text-gray-400 mb-1">Sunucu Çalışma Süresi</div>
                                    <div className="text-lg font-semibold text-white">{formatUptime(stats.system.serverUptime)}</div>
                                </div>

                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Database className="text-blue-400" size={24} />
                                    </div>
                                    <div className="text-sm text-gray-400 mb-1">Son Yedekleme</div>
                                    <div className="text-sm font-semibold text-white">{formatDate(stats.system.lastBackup)}</div>
                                </div>

                                <div className="text-center">
                                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <BarChart3 className="text-purple-400" size={24} />
                                    </div>
                                    <div className="text-sm text-gray-400 mb-1">Depolama Kullanımı</div>
                                    <div className="text-lg font-semibold text-white">{stats.system.storageUsed} GB</div>
                                </div>

                                <div className="text-center">
                                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <Activity className="text-orange-400" size={24} />
                                    </div>
                                    <div className="text-sm text-gray-400 mb-1">API İstekleri (Bugün)</div>
                                    <div className="text-lg font-semibold text-white">{stats.system.apiRequestsToday.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}