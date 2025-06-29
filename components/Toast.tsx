"use client";

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Animasyon sonrası kaldır
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <FaCheckCircle className="text-green-400" />,
        error: <FaExclamationCircle className="text-red-400" />,
        info: <FaInfoCircle className="text-blue-400" />
    };

    const styles = {
        success: 'bg-green-500/20 border-green-500',
        error: 'bg-red-500/20 border-red-500',
        info: 'bg-blue-500/20 border-blue-500'
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${styles[type]} bg-gray-800 shadow-lg max-w-sm`}>
                <div className="text-xl">{icons[type]}</div>
                <p className="text-white flex-1">{message}</p>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
}