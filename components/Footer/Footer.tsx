import React from 'react';
import Link from 'next/link';

interface FooterLink {
    href: string;
    label: string;
    icon?: string;
    external?: boolean;
}

interface FooterSection {
    title: string;
    links: FooterLink[];
}

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    const footerSections: FooterSection[] = [
        {
            title: 'Keşfet',
            links: [
                { href: '/games', label: 'Oyunlar', icon: '🎮' },
                { href: '/announcements', label: 'Duyurular', icon: '📢' },
                { href: '/members', label: 'Üyeler', icon: '👥' },
                { href: '/events', label: 'Etkinlikler', icon: '🗓️' }
            ]
        },
        {
            title: 'Topluluk',
            links: [
                { href: '#', label: 'Discord', icon: '💬', external: true },
                { href: '/support', label: 'Destek', icon: '🛠️' },
                { href: '/feedback', label: 'Geri Bildirim', icon: '💭' },
                { href: '/blog', label: 'Blog', icon: '📝' }
            ]
        },
        {
            title: 'Yasal',
            links: [
                { href: '/terms', label: 'Kullanım Şartları' },
                { href: '/privacy', label: 'Gizlilik Politikası' },
                { href: '/cookies', label: 'Çerez Politikası' },
                { href: '/guidelines', label: 'Topluluk Kuralları' }
            ]
        }
    ];

    return (
        <footer className="relative border-t border-white/5 bg-gradient-to-b from-[#202225] to-[#1a1c1f]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                }}></div>
            </div>

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                        {/* Brand Section */}
                        <div className="space-y-6">
                            <div className="flex items-center space-x-3">
                                <div className="relative w-12 h-12 bg-gradient-to-br from-[#5865f2] to-[#3c82f6] rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
                                    <span className="text-xl">P</span>
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#5865f2] to-[#3c82f6] rounded-xl opacity-20 blur-lg"></div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        PRV10
                                    </h3>
                                    <p className="text-sm text-gray-400">Discord Topluluğu</p>
                                </div>
                            </div>

                            <p className="text-gray-400 max-w-md leading-relaxed">
                                Discord topluluğumuzda oyun planları, duyurular ve üye etkileşimlerini takip edebileceğiniz modern platform.
                                Birlikte oynayalım, birlikte büyüyelim! 🚀
                            </p>

                            {/* Social Links */}
                            <div className="flex space-x-4">
                                <a
                                    href="#"
                                    className="group p-3 bg-white/5 hover:bg-[#5865f2]/20 rounded-lg transition-all duration-300 hover:scale-105"
                                    aria-label="Discord sunucusuna katıl"
                                >
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-[#5865f2] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                </a>
                                <a
                                    href="#"
                                    className="group p-3 bg-white/5 hover:bg-blue-500/20 rounded-lg transition-all duration-300 hover:scale-105"
                                    aria-label="Twitter'da takip et"
                                >
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                    </svg>
                                </a>
                                <a
                                    href="#"
                                    className="group p-3 bg-white/5 hover:bg-gray-500/20 rounded-lg transition-all duration-300 hover:scale-105"
                                    aria-label="GitHub'da incele"
                                >
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Links Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {footerSections.map((section) => (
                                <div key={section.title} className="space-y-4">
                                    <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                                        {section.title}
                                    </h4>
                                    <ul className="space-y-3">
                                        {section.links.map((link) => (
                                            <li key={link.href}>
                                                {link.external ? (
                                                    <a
                                                        href={link.href}
                                                        className="group flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {link.icon && <span className="text-xs">{link.icon}</span>}
                                                        <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                                                            {link.label}
                                                        </span>
                                                    </a>
                                                ) : (
                                                    <Link
                                                        href={link.href}
                                                        className="group flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                                                    >
                                                        {link.icon && <span className="text-xs">{link.icon}</span>}
                                                        <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                                                            {link.label}
                                                        </span>
                                                    </Link>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="pt-8 border-t border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <div className="flex items-center space-x-4">
                                <p className="text-sm text-gray-400">
                                    © {currentYear} PRV10. Tüm hakları saklıdır.
                                </p>
                                <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500">
                                    <span>❤️ ile yapıldı</span>
                                    <span>•</span>
                                    <span>🇹🇷 Türkiye'de</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-6">
                                <Link
                                    href="/status"
                                    className="flex items-center space-x-2 text-xs text-gray-400 hover:text-green-400 transition-colors duration-200"
                                >
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span>Sistem Durumu</span>
                                </Link>
                                <div className="flex space-x-4">
                                    <Link
                                        href="/terms"
                                        className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
                                    >
                                        Şartlar
                                    </Link>
                                    <Link
                                        href="/privacy"
                                        className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
                                    >
                                        Gizlilik
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 