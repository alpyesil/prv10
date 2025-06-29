import React from 'react';

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    className?: string;
    fullScreen?: boolean;
}

export function Loading({ size = 'md', text, className = '', fullScreen = false }: LoadingProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    const LoadingSpinner = () => (
        <div className={`animate-spin rounded-full border-4 border-gray-600 border-t-[#5865f2] ${sizeClasses[size]} ${className}`}></div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-[#1e1f24]/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#2f3136] rounded-xl border border-white/10 p-8 text-center">
                    <LoadingSpinner />
                    {text && (
                        <p className={`text-gray-300 mt-4 ${textSizeClasses[size]}`}>{text}</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-3">
            <LoadingSpinner />
            {text && (
                <p className={`text-gray-300 ${textSizeClasses[size]}`}>{text}</p>
            )}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e1f24] via-[#2a2d31] to-[#36393f] animate-pulse">
            {/* Header Skeleton */}
            <div className="relative">
                <div className="h-80 lg:h-96 bg-gray-700"></div>
                <div className="container mx-auto px-4">
                    <div className="relative -mt-20 lg:-mt-24">
                        <div className="flex flex-col lg:flex-row items-start lg:items-end space-y-6 lg:space-y-0 lg:space-x-8">
                            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-xl bg-gray-600"></div>
                            <div className="flex-1 pb-6">
                                <div className="h-8 bg-gray-600 rounded mb-4 w-64"></div>
                                <div className="h-4 bg-gray-700 rounded mb-2 w-32"></div>
                                <div className="h-4 bg-gray-700 rounded mb-4 w-96"></div>
                                <div className="flex space-x-2">
                                    <div className="h-8 bg-gray-600 rounded w-20"></div>
                                    <div className="h-8 bg-gray-600 rounded w-20"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                            <div className="h-6 bg-gray-600 rounded mb-4 w-48"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-4 bg-gray-700 rounded"></div>
                                    ))}
                                </div>
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-12 bg-gray-700 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                                <div className="h-6 bg-gray-600 rounded mb-4 w-32"></div>
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, j) => (
                                        <div key={j} className="h-4 bg-gray-700 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ComponentSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`bg-[#2f3136] rounded-xl border border-white/10 p-6 animate-pulse ${className}`}>
            <div className="h-6 bg-gray-600 rounded mb-4 w-48"></div>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-700 rounded"></div>
                ))}
            </div>
        </div>
    );
} 