"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthContext';
import { useNotifications } from '@/lib/hooks/useNotifications';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, isAuthenticated, loading, login, logout } = useAuth();
    const { notifications } = useNotifications();

    // Development logging
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🔐 [Header] Auth State:', {
                isAuthenticated,
                loading,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    roles: user.roles,
                    permissions: user.permissions
                } : null,
                timestamp: new Date().toISOString()
            });
        }
    }, [isAuthenticated, loading, user]);

    return (
        <>
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#2f3136]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#2f3136]/80">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo/Brand */}
                        <div className="flex items-center">
                            <Link
                                href="/"
                                className="group flex items-center space-x-3 text-white hover:text-[#5865f2] transition-all duration-300"
                                aria-label="Ana sayfaya git"
                            >
                                <div className="relative w-10 h-10 bg-gradient-to-br from-[#5865f2] to-[#3c82f6] rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:shadow-[#5865f2]/25 group-hover:scale-105 transition-all duration-300">
                                    <span className="text-lg">P</span>
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#5865f2] to-[#3c82f6] rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    PRV10
                                </span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-1" role="navigation" aria-label="Ana navigasyon">
                            {[
                                { href: '/games', label: 'Oyunlar', icon: '🎮' },
                                { href: '/announcements', label: 'Duyurular', icon: '📢' },
                                { href: '/members', label: 'Üyeler', icon: '👥' },
                                { href: '/clans', label: 'Klanlar', icon: '⚔️' },
                                ...(isAuthenticated ? [{ href: '/messages', label: 'Mesajlar', icon: '💬' }] : []),
                                ...(isAuthenticated && user?.roles?.some(role => ['admin', 'super_admin'].includes(role.toLowerCase())) ? [{ href: '/admin', label: 'Admin', icon: '🛡️' }] : [])
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-300 font-medium rounded-lg hover:bg-white/5"
                                >
                                    <span className="flex items-center space-x-2">
                                        <span className="text-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </span>
                                    <div className="absolute bottom-0 left-1/2 h-0.5 w-0 bg-gradient-to-r from-[#5865f2] to-[#3c82f6] transition-all duration-300 group-hover:w-3/4 group-hover:-translate-x-1/2"></div>
                                </Link>
                            ))}
                        </nav>

                        {/* User Actions */}
                        <div className="flex items-center space-x-3">
                            {loading ? (
                                <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#5865f2] border-t-transparent"></div>
                            ) : isAuthenticated && user ? (
                                <div className="flex items-center space-x-4">
                                    {/* Notifications */}
                                    <button className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-300">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {notifications && notifications.unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                {notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Messages Button (Desktop) */}
                                    <Link
                                        href="/messages"
                                        className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-300"
                                        title="Mesajlar"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        {/* Message notification badge from conversations could be shown here */}
                                    </Link>

                                    {/* User Dropdown */}
                                    <div className="relative group">
                                        <button className="flex items-center space-x-3 p-2 rounded-xl bg-gradient-to-r from-[#36393f]/80 to-[#2f3136]/80 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-[#5865f2]/10">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full overflow-hidden relative ring-2 ring-[#5865f2]/20 hover:ring-[#5865f2]/40 transition-all duration-300">
                                                {user.image ? (
                                                    <img
                                                        src={user.image}
                                                        alt={user.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            console.warn('🖼️ [Header] Avatar load failed:', user.image);
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold">
                                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                )}
                                                {/* Online Status with Pulse */}
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#2f3136] rounded-full">
                                                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                                                </div>
                                            </div>

                                            {/* User Info */}
                                            <div className="hidden md:block text-left">
                                                <div className="text-sm font-semibold text-white flex items-center space-x-2">
                                                    <span>{user.name || 'Unknown User'}</span>
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                </div>
                                                <div className="text-xs text-gray-400 flex items-center space-x-2">
                                                    <span>{user.roles[0] || 'Üye'}</span>
                                                    {user.roles && user.roles.length > 1 && (
                                                        <span className="text-[#5865f2] font-medium">+{user.roles.length - 1}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Dropdown Arrow */}
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-[#2f3136] rounded-xl shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                                            {/* Profile Header */}
                                            <div className="p-6 border-b border-white/10">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 rounded-full overflow-hidden relative ring-2 ring-[#5865f2]/30">
                                                        {user.image ? (
                                                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold text-xl">
                                                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                        )}
                                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-3 border-[#2f3136] rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-white">{user.name}</h3>
                                                        <p className="text-sm text-gray-400">{user.email || user.discordId}</p>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#5865f2]/20 text-[#5865f2] border border-[#5865f2]/30">
                                                                {user.roles[0] || 'Üye'}
                                                            </span>
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                                                ✓ Discord
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="p-2">
                                                <Link href={`/profile/${user.id}`} className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 group/item">
                                                    <svg className="w-5 h-5 text-[#5865f2] group-hover/item:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <div>
                                                        <div className="font-medium">Profilim</div>
                                                        <div className="text-xs text-gray-500">Profil bilgilerini görüntüle</div>
                                                    </div>
                                                </Link>

                                                <Link href="/messages" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 group/item">
                                                    <svg className="w-5 h-5 text-blue-500 group-hover/item:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    <div>
                                                        <div className="font-medium">Mesajlarım</div>
                                                        <div className="text-xs text-gray-500">Konuşmalar ve sohbet</div>
                                                    </div>
                                                </Link>

                                                <Link href="/games" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 group/item">
                                                    <svg className="w-5 h-5 text-green-500 group-hover/item:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1z" />
                                                    </svg>
                                                    <div>
                                                        <div className="font-medium">Oyunlarım</div>
                                                        <div className="text-xs text-gray-500">{user.roles?.length || 0} oyun</div>
                                                    </div>
                                                </Link>

                                                <Link href="/settings" className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-300 group/item">
                                                    <svg className="w-5 h-5 text-gray-400 group-hover/item:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <div>
                                                        <div className="font-medium">Ayarlar</div>
                                                        <div className="text-xs text-gray-500">Hesap ayarları</div>
                                                    </div>
                                                </Link>

                                                <div className="border-t border-white/10 my-2"></div>

                                                <button
                                                    onClick={() => {
                                                        console.log('🚪 [Header] Logout initiated');
                                                        logout();
                                                    }}
                                                    className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300 group/item"
                                                >
                                                    <svg className="w-5 h-5 group-hover/item:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    <div className="text-left">
                                                        <div className="font-medium">Çıkış Yap</div>
                                                        <div className="text-xs text-red-500/70">Hesaptan çıkış yap</div>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        console.log('🔑 [Header] Login initiated');
                                        login();
                                    }}
                                    disabled={loading}
                                    className="group relative overflow-hidden px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#5865f2] to-[#4752c4] rounded-lg shadow-lg hover:shadow-[#5865f2]/25 transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2f3136] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    title={loading ? 'Giriş yapılıyor...' : 'Discord ile Giriş Yap'}
                                >
                                    <span className="relative z-10 flex items-center space-x-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                        </svg>
                                        <span>Discord ile Giriş</span>
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#4752c4] to-[#5865f2] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                            )}

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden group p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:ring-offset-2 focus:ring-offset-[#2f3136]"
                                aria-label="Menüyü aç/kapat"
                                aria-expanded={isMenuOpen}
                            >
                                <div className="relative w-6 h-6">
                                    <span className={`absolute block h-0.5 w-6 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 top-3' : 'top-1'}`}></span>
                                    <span className={`absolute block h-0.5 w-6 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'top-3'}`}></span>
                                    <span className={`absolute block h-0.5 w-6 bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 top-3' : 'top-5'}`}></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            <div className={`lg:hidden fixed inset-x-0 top-16 z-40 bg-[#2f3136]/95 backdrop-blur-xl border-b border-white/10 transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
                <div className="container mx-auto px-4 py-6">
                    <nav className="space-y-1">
                        {[
                            { href: '/games', label: 'Oyunlar', icon: '🎮' },
                            { href: '/announcements', label: 'Duyurular', icon: '📢' },
                            { href: '/members', label: 'Üyeler', icon: '👥' },
                            { href: '/clans', label: 'Klanlar', icon: '⚔️' },
                            ...(isAuthenticated ? [{ href: '/messages', label: 'Mesajlar', icon: '💬' }] : []),
                            ...(isAuthenticated && user?.roles?.some(role => ['admin', 'super_admin'].includes(role.toLowerCase())) ? [{ href: '/admin', label: 'Admin', icon: '🛡️' }] : [])
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Mobile menu overlay */}
            {isMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-30"
                    onClick={() => setIsMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
};

export default Header; 