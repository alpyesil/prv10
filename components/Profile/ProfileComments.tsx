"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useProfileContext } from '@/components/providers/ProfileContext';
import { useSession } from 'next-auth/react';

interface ProfileComment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    timestamp: number;
    likes: number;
    likedBy: string[];
    replies?: ProfileComment[];
}

interface ProfileCommentsProps {
    userId: string;
}

export default function ProfileComments({ userId }: ProfileCommentsProps) {
    const { data: session } = useSession();
    const { comments, isLoading: loading, error } = useProfileContext();
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddComment = async () => {
        if (!newComment.trim() || isSubmitting) return;
        // TODO: Implement comment adding functionality
        console.log('Adding comment:', newComment);
    };

    const handleLikeComment = async (commentId: string) => {
        // TODO: Implement comment liking functionality
        console.log('Liking comment:', commentId);
    };

    const isCommentLiked = (comment: any) => {
        return session?.user ? comment.likedBy?.includes(session.user.id) : false;
    };

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'şimdi';
        if (minutes < 60) return `${minutes} dakika önce`;
        if (hours < 24) return `${hours} saat önce`;
        if (days < 7) return `${days} gün önce`;

        return new Date(timestamp).toLocaleDateString('tr-TR');
    };

    const renderComment = (comment: any, isReply = false) => (
        <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : ''}`}>
            <div className="flex space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden relative">
                        {comment.authorAvatar ? (
                            <Image src={comment.authorAvatar} alt={comment.authorName} width={40} height={40} />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold">
                                {comment.authorName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Comment Content */}
                <div className="flex-1 bg-[#36393f] rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">{comment.authorName}</span>
                            <span className="text-xs text-gray-400">{formatTimestamp(comment.timestamp)}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleLikeComment(comment.id)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors duration-200 ${isCommentLiked(comment)
                                    ? 'text-red-400 hover:text-red-300'
                                    : 'text-gray-400 hover:text-red-400'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill={isCommentLiked(comment) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{comment.likes}</span>
                            </button>

                            {!isReply && (
                                <button
                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                    className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    Yanıtla
                                </button>
                            )}

                            {session?.user?.id === comment.authorId && (
                                <button
                                    onClick={() => deleteComment(comment.id)}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200"
                                >
                                    Sil
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-300 leading-relaxed">{comment.content}</p>
                </div>
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
                <div className="ml-12 mt-3">
                    <div className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold text-sm">
                            {session?.user?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Yanıtınızı yazın..."
                                className="w-full bg-[#36393f] text-white rounded-lg p-3 border border-white/10 focus:border-[#5865f2] focus:outline-none resize-none"
                                rows={2}
                            />
                            <div className="flex justify-end space-x-2 mt-2">
                                <button
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText('');
                                    }}
                                    className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={() => {
                                        // Handle reply submission
                                        setReplyingTo(null);
                                        setReplyText('');
                                    }}
                                    className="px-4 py-1 bg-[#5865f2] text-white text-sm rounded hover:bg-[#4752c4] transition-colors duration-200"
                                >
                                    Yanıtla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.map((reply: any) => renderComment(reply, true))}
        </div>
    );

    if (loading) {
        return (
            <div className="bg-[#2f3136] rounded-xl border border-white/10 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex space-x-3">
                                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                                    <div className="h-12 bg-gray-700 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#2f3136] rounded-xl border border-white/10">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">Profil Yorumları</h3>
                <p className="text-gray-400">{comments.length} yorum</p>
                {error && (
                    <div className="mt-2 text-red-400 text-sm">{error}</div>
                )}
            </div>

            {/* Add Comment Form */}
            {session?.user && (
                <div className="p-6 border-b border-white/10">
                    {/* Debug Test Button */}
                    <div className="mb-4">
                        <button
                            onClick={() => {
                                console.log('🧪 [ProfileComments] Adding test comment');
                                (window as any).testAddComment = handleAddComment;
                                setNewComment('Test yorumu - Firebase çalışıyor mu? 🧪');
                                handleAddComment();
                            }}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 text-sm"
                        >
                            🧪 Test Yorum Ekle
                        </button>
                    </div>

                    <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white font-bold">
                                {session.user.name?.charAt(0) || 'S'}
                            </div>
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Bu profile yorum yap..."
                                className="w-full bg-[#36393f] text-white rounded-lg p-3 border border-white/10 focus:border-[#5865f2] focus:outline-none resize-none"
                                rows={3}
                                disabled={isSubmitting}
                            />
                            <div className="flex justify-between items-center mt-3">
                                <div className="text-xs text-gray-400">
                                    Lütfen topluluk kurallarına uygun yorumlar yapın.
                                </div>
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="px-6 py-2 bg-[#5865f2] text-white rounded-lg hover:bg-[#4752c4] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Gönderiliyor...' : 'Yorum Yap'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Comments List */}
            <div className="p-6">
                {comments.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">💬</div>
                        <h3 className="text-lg font-medium text-white mb-2">Henüz yorum yok</h3>
                        <p className="text-gray-400">Bu profile ilk yorumu sen yap!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {comments.map(comment => renderComment(comment))}
                    </div>
                )}
            </div>

            {/* Load More */}
            {comments.length > 0 && (
                <div className="p-6 pt-0">
                    <button className="w-full py-3 text-[#5865f2] hover:text-[#4752c4] transition-colors duration-200 font-medium">
                        Daha Fazla Yorum Yükle
                    </button>
                </div>
            )}
        </div>
    );
} 