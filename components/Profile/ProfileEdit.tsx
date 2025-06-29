"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthContext';
import { Loading } from '@/components/ui/loading';
import Image from 'next/image';

interface ProfileEditProps {
    isOpen: boolean;
    onClose: () => void;
    userData: any;
    onSave: (data: any) => void;
}

export default function ProfileEdit({ isOpen, onClose, userData, onSave }: ProfileEditProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        status: '',
        banner: '',
        showProfile: true,
        showGaming: true,
        showActivity: true
    });

    useEffect(() => {
        if (userData) {
            setFormData({
                displayName: userData.displayName || '',
                bio: userData.bio || '',
                location: userData.location || '',
                status: userData.status || '',
                banner: userData.banner || '',
                showProfile: true,
                showGaming: true,
                showActivity: true
            });
        }
    }, [userData]);

    const handleSave = async () => {
        try {
            setSaving(true);

            // Firebase'e kaydet
            const response = await fetch('/api/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id,
                    updates: formData
                }),
            });

            if (response.ok) {
                onSave(formData);
                onClose();
            } else {
                throw new Error('Profil güncellenirken hata oluştu');
            }
        } catch (error) {
            console.error('Profil güncelleme hatası:', error);
            alert('Profil güncellenirken bir hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#2f3136] rounded-xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">Profili Düzenle</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Profile Picture Section */}
                    <div className="text-center">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 rounded-xl overflow-hidden ring-4 ring-[#5865f2]/20">
                                {user?.image ? (
                                    <Image
                                        src={user.image}
                                        alt="Profile"
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold text-2xl">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <button className="absolute -bottom-2 -right-2 bg-[#5865f2] text-white p-2 rounded-full hover:bg-[#4752c4] transition-colors duration-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Discord avatar değiştirilemez</p>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Görünen İsim
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full bg-[#36393f] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                                placeholder="Görünen isminizi girin..."
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Konum
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full bg-[#36393f] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                                placeholder="Şehir, Ülke..."
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Durum Mesajı
                        </label>
                        <input
                            type="text"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full bg-[#36393f] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                            placeholder="Ne yapıyorsunuz?"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Hakkınızda
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={4}
                            className="w-full bg-[#36393f] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                            placeholder="Kendinizden bahsedin..."
                        />
                        <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 karakter</p>
                    </div>

                    {/* Banner URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Banner URL'si
                        </label>
                        <input
                            type="url"
                            value={formData.banner}
                            onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                            className="w-full bg-[#36393f] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
                            placeholder="https://..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Profil banner'ınız için bir resim URL'si</p>
                    </div>

                    {/* Privacy Settings */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Gizlilik Ayarları</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Profil bilgilerini göster</span>
                                <button
                                    onClick={() => setFormData({ ...formData, showProfile: !formData.showProfile })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.showProfile ? 'bg-[#5865f2]' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.showProfile ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Oyun aktivitelerini göster</span>
                                <button
                                    onClick={() => setFormData({ ...formData, showGaming: !formData.showGaming })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.showGaming ? 'bg-[#5865f2]' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.showGaming ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Aktivite geçmişini göster</span>
                                <button
                                    onClick={() => setFormData({ ...formData, showActivity: !formData.showActivity })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.showActivity ? 'bg-[#5865f2]' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.showActivity ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-6 py-2 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-colors duration-200 disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
                    >
                        {saving && <Loading size="sm" />}
                        <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
} 