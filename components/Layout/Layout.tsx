import React from 'react';
import Header from '../Header';
import Footer from '../Footer';

interface LayoutProps {
    children: React.ReactNode;
    className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#36393f] via-[#32353a] to-[#2f3136] text-white">
            {/* Background Pattern */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                        backgroundSize: '24px 24px'
                    }}
                />
            </div>

            {/* Gradient Overlays */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#5865f2]/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3c82f6]/5 rounded-full blur-3xl"></div>
            </div>

            <Header />

            <main
                className={`relative flex-1 ${className}`}
                role="main"
                id="main-content"
            >
                {children}
            </main>

            <Footer />
        </div>
    );
};

export default Layout; 