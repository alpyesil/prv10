"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthContext';

const HomeContent: React.FC = () => {
    const { user, isAuthenticated } = useAuth();

    return (
        <div className="relative overflow-hidden">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Welcome Message */}
                        <div className="mb-8">
                            {isAuthenticated && user ? (
                                <div className="inline-flex items-center space-x-3 px-6 py-3 bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-full mb-6">
                                    <div className="w-8 h-8 rounded-full overflow-hidden">
                                        {user.image ? (
                                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold text-sm">
                                                {user.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[#5865f2] font-medium">
                                        Hoş geldin, {user.name || 'Kullanıcı'}! 👋
                                    </span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#36393f]/50 border border-white/10 rounded-full mb-6 text-gray-400">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                    <span className="text-sm">Discord ile giriş yaparak başlayın</span>
                                </div>
                            )}
                        </div>

                        {/* Main Title */}
                        <h1 className="text-5xl lg:text-7xl font-bold mb-8 bg-gradient-to-br from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight">
                            PRV10
                            <span className="block text-4xl lg:text-5xl text-[#5865f2] mt-2">
                                Gaming Community
                            </span>
                        </h1>

                        {/* Description */}
                        <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                            Discord topluluğumuzda <span className="text-[#5865f2] font-semibold">oyunlar</span>,
                            <span className="text-blue-400 font-semibold"> etkinlikler</span> ve
                            <span className="text-green-400 font-semibold"> arkadaşlıklar</span> seni bekliyor.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        href="/messages"
                                        className="group px-8 py-4 bg-gradient-to-r from-[#5865f2] to-[#4752c4] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-[#5865f2]/25 transition-all duration-300 hover:scale-105"
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            <span>💬</span>
                                            <span>Mesajlara Git</span>
                                        </span>
                                    </Link>
                                    <Link
                                        href={`/profile/${user?.id}`}
                                        className="group px-8 py-4 border-2 border-white/20 text-white rounded-xl font-semibold text-lg hover:border-[#5865f2] hover:bg-[#5865f2]/10 transition-all duration-300 hover:scale-105"
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            <span>👤</span>
                                            <span>Profilim</span>
                                        </span>
                                    </Link>
                                </>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/api/auth/signin"
                                        className="group px-8 py-4 bg-gradient-to-r from-[#5865f2] to-[#4752c4] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-[#5865f2]/25 transition-all duration-300 hover:scale-105"
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                            </svg>
                                            <span>Discord ile Katıl</span>
                                        </span>
                                    </Link>
                                    <Link
                                        href="/members"
                                        className="group px-8 py-4 border-2 border-white/20 text-white rounded-xl font-semibold text-lg hover:border-[#5865f2] hover:bg-[#5865f2]/10 transition-all duration-300 hover:scale-105"
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            <span>👥</span>
                                            <span>Topluluğu Keşfet</span>
                                        </span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gradient-to-br from-[#36393f]/50 to-[#2f3136]/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 text-white">
                            Topluluk <span className="text-[#5865f2]">Özellikleri</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Gaming */}
                            <div className="group p-8 bg-[#2f3136]/80 border border-white/10 rounded-2xl hover:border-[#5865f2]/50 transition-all duration-300 hover:scale-105">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#5865f2] to-[#4752c4] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl">🎮</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">Oyun Platformları</h3>
                                <p className="text-gray-300">Steam, Xbox, PlayStation ve daha fazla platform üzerinden oyun aktivitelerini takip edin.</p>
                            </div>

                            {/* Community */}
                            <div className="group p-8 bg-[#2f3136]/80 border border-white/10 rounded-2xl hover:border-blue-500/50 transition-all duration-300 hover:scale-105">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl">👥</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">Aktif Topluluk</h3>
                                <p className="text-gray-300">Discord sunucumuzda aktif üyelerle tanışın, ekipler kurun ve arkadaş edinin.</p>
                            </div>

                            {/* Events */}
                            <div className="group p-8 bg-[#2f3136]/80 border border-white/10 rounded-2xl hover:border-green-500/50 transition-all duration-300 hover:scale-105">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">Etkinlikler</h3>
                                <p className="text-gray-300">Turnuvalar, oyun geceleri ve özel etkinliklerle topluluk deneyimini yaşayın.</p>
                            </div>

                            {/* Messages */}
                            <div className="group p-8 bg-[#2f3136]/80 border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all duration-300 hover:scale-105">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl">💬</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">Anlık Mesajlaşma</h3>
                                <p className="text-gray-300">Diğer üyelerle birebir veya grup halinde sohbet edin, stratejiler paylaşın.</p>
                            </div>

                            {/* Profiles */}
                            <div className="group p-8 bg-[#2f3136]/80 border border-white/10 rounded-2xl hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl">👤</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">Kişisel Profiller</h3>
                                <p className="text-gray-300">Oyun istatistiklerinizi, başarımlarınızı ve aktivitelerinizi sergileyin.</p>
                            </div>

                            {/* Roles */}
                            <div className="group p-8 bg-[#2f3136]/80 border border-white/10 rounded-2xl hover:border-red-500/50 transition-all duration-300 hover:scale-105">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl">🎭</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">Rol Sistemi</h3>
                                <p className="text-gray-300">Discord rollerinize göre özel yetkilere sahip olun ve topluluktaki konumunuzu belirleyin.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-16 text-white">
                            Topluluk <span className="text-[#5865f2]">İstatistikleri</span>
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <div className="text-4xl lg:text-5xl font-bold text-[#5865f2] mb-2">250+</div>
                                <div className="text-gray-300">Aktif Üye</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl lg:text-5xl font-bold text-blue-500 mb-2">50+</div>
                                <div className="text-gray-300">Desteklenen Oyun</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl lg:text-5xl font-bold text-green-500 mb-2">100+</div>
                                <div className="text-gray-300">Günlük Mesaj</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl lg:text-5xl font-bold text-yellow-500 mb-2">24/7</div>
                                <div className="text-gray-300">Destek</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomeContent; 