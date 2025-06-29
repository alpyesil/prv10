import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { database } from '@/lib/firebase-rest';

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
        [emoji: string]: string[]; // emoji -> user IDs
    };
    commentsCount: number;
    isVisible: boolean;
}

export async function GET(request: NextRequest) {
    try {
        console.log('📢 [Announcements API] Request received');
        
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const type = searchParams.get('type');
        const pinned = searchParams.get('pinned') === 'true';

        // Public endpoint - no authentication required for reading announcements
        const announcementsRef = await database.ref('announcements');
        const snapshot = await announcementsRef.get();

        if (!snapshot.exists()) {
            console.log('📢 [Announcements API] No announcements found, creating sample data');
            
            // Create sample announcements
            const sampleAnnouncements = {
                'ann_001': {
                    id: 'ann_001',
                    title: 'PRV10 Sunucusu Açıldı! 🎉',
                    content: 'Merhaba PRV10 topluluğu! Yeni Discord sunucumuz artık açık. Herkesi aramızda görmekten mutluluk duyarız. Sunucuda oyun planları, duyurular ve eğlenceli aktiviteler sizi bekliyor!',
                    author: {
                        id: 'admin_001',
                        name: 'PRV10 Admin',
                        avatar: 'https://cdn.discordapp.com/avatars/123456789/avatar.png'
                    },
                    type: 'important',
                    priority: 'high',
                    pinned: true,
                    tags: ['genel', 'hoşgeldin', 'açılış'],
                    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 7), // 1 hafta önce
                    updatedAt: Date.now() - (1000 * 60 * 60 * 24 * 7),
                    readBy: [],
                    reactions: {
                        '🎉': [],
                        '👏': [],
                        '❤️': []
                    },
                    commentsCount: 15,
                    isVisible: true
                },
                'ann_002': {
                    id: 'ann_002',
                    title: 'CS2 Turnuvası Duyurusu 🏆',
                    content: 'Önümüzdeki hafta sonu CS2 turnuvası düzenliyoruz! 5v5 formatında, ödüllü turnuva. Katılmak isteyenler #turnuva kanalından kayıt olabilir. Son kayıt tarihi: 25 Aralık.',
                    author: {
                        id: 'mod_001',
                        name: 'Turnuva Moderatörü',
                        avatar: 'https://cdn.discordapp.com/avatars/123456790/avatar.png'
                    },
                    type: 'event',
                    priority: 'high',
                    pinned: true,
                    tags: ['cs2', 'turnuva', 'oyun', 'etkinlik'],
                    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 3), // 3 gün önce
                    updatedAt: Date.now() - (1000 * 60 * 60 * 24 * 3),
                    readBy: [],
                    reactions: {
                        '🔥': [],
                        '🎮': [],
                        '💪': []
                    },
                    commentsCount: 32,
                    isVisible: true
                },
                'ann_003': {
                    id: 'ann_003',
                    title: 'Sunucu Kuralları Güncellendi 📋',
                    content: 'Sunucu kurallarımızda bazı güncellemeler yapıldı. Lütfen #kurallar kanalını kontrol edin. Ana değişiklikler: spam kuralları sıkılaştırıldı, oyun kanalları yeniden düzenlendi.',
                    author: {
                        id: 'admin_002',
                        name: 'Kural Moderatörü',
                        avatar: 'https://cdn.discordapp.com/avatars/123456791/avatar.png'
                    },
                    type: 'update',
                    priority: 'medium',
                    pinned: false,
                    tags: ['kurallar', 'güncelleme', 'önemli'],
                    createdAt: Date.now() - (1000 * 60 * 60 * 24 * 2), // 2 gün önce
                    updatedAt: Date.now() - (1000 * 60 * 60 * 24 * 2),
                    readBy: [],
                    reactions: {
                        '👍': [],
                        '📚': []
                    },
                    commentsCount: 8,
                    isVisible: true
                },
                'ann_004': {
                    id: 'ann_004',
                    title: 'Valorant Rankl Maçlar 🎯',
                    content: 'Her Cuma akşamı 21:00\'da Valorant rankl maçlarımız başlıyor. Katılmak isteyenler #valorant-rankl kanalında kendilerini bildirsin. Takım dengeleri yapılacak.',
                    author: {
                        id: 'game_mod_001',
                        name: 'Valorant Moderatörü',
                        avatar: 'https://cdn.discordapp.com/avatars/123456792/avatar.png'
                    },
                    type: 'event',
                    priority: 'medium',
                    pinned: false,
                    tags: ['valorant', 'rankl', 'rutin', 'cuma'],
                    createdAt: Date.now() - (1000 * 60 * 60 * 24), // 1 gün önce
                    updatedAt: Date.now() - (1000 * 60 * 60 * 24),
                    readBy: [],
                    reactions: {
                        '🎯': [],
                        '🔥': []
                    },
                    commentsCount: 12,
                    isVisible: true
                },
                'ann_005': {
                    id: 'ann_005',
                    title: 'Bot Güncellemesi 🤖',
                    content: 'PRV10 Bot\'a yeni özellikler eklendi: !profil komutu ile Discord profilinizi görüntüleyebilir, !oyun komutu ile ne oynadığınızı paylaşabilirsiniz.',
                    author: {
                        id: 'dev_001',
                        name: 'Geliştirici',
                        avatar: 'https://cdn.discordapp.com/avatars/123456793/avatar.png'
                    },
                    type: 'update',
                    priority: 'low',
                    pinned: false,
                    tags: ['bot', 'güncelleme', 'özellik'],
                    createdAt: Date.now() - (1000 * 60 * 60 * 12), // 12 saat önce
                    updatedAt: Date.now() - (1000 * 60 * 60 * 12),
                    readBy: [],
                    reactions: {
                        '🤖': [],
                        '⚡': []
                    },
                    commentsCount: 5,
                    isVisible: true
                }
            };

            await announcementsRef.set(sampleAnnouncements);
            console.log('✅ [Announcements API] Sample announcements created');
        }

        // Get all announcements
        const announcementsSnapshot = await announcementsRef.get();
        const announcementsData = announcementsSnapshot.val() || {};
        
        let announcements: Announcement[] = Object.values(announcementsData);

        // Filter by type if specified
        if (type && type !== 'all') {
            announcements = announcements.filter(ann => ann.type === type);
        }

        // Filter by pinned if specified
        if (pinned) {
            announcements = announcements.filter(ann => ann.pinned === true);
        }

        // Filter only visible announcements
        announcements = announcements.filter(ann => ann.isVisible !== false);

        // Sort by pinned first, then by creation date (newest first)
        announcements.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.createdAt - a.createdAt;
        });

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedAnnouncements = announcements.slice(startIndex, endIndex);

        const totalCount = announcements.length;
        const totalPages = Math.ceil(totalCount / limit);

        console.log(`✅ [Announcements API] Returning ${paginatedAnnouncements.length} announcements (page ${page}/${totalPages})`);

        return NextResponse.json({
            announcements: paginatedAnnouncements,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            filters: {
                type: type || 'all',
                pinned: pinned || false
            }
        });

    } catch (error) {
        console.error('💥 [Announcements API] Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('📢 [Announcements API] POST request received');
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has permission to create announcements (admin/moderator only)
        const userRoles = session.user.roles || [];
        const canCreateAnnouncements = userRoles.some(role => 
            ['admin', 'moderator', 'announcement_manager'].includes(role.toLowerCase())
        );

        if (!canCreateAnnouncements) {
            return NextResponse.json({ 
                error: 'Forbidden', 
                message: 'Bu işlemi gerçekleştirmek için yetkiniz yok' 
            }, { status: 403 });
        }

        const body = await request.json();
        const { title, content, type, priority, pinned, tags } = body;

        if (!title || !content) {
            return NextResponse.json({ 
                error: 'Bad Request', 
                message: 'Başlık ve içerik zorunludur' 
            }, { status: 400 });
        }

        const announcementId = `ann_${Date.now()}`;
        const newAnnouncement: Announcement = {
            id: announcementId,
            title,
            content,
            author: {
                id: session.user.id,
                name: session.user.name || 'Unknown User',
                avatar: session.user.image || ''
            },
            type: type || 'general',
            priority: priority || 'medium',
            pinned: pinned || false,
            tags: tags || [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            readBy: [],
            reactions: {},
            commentsCount: 0,
            isVisible: true
        };

        const announcementRef = database.ref(`announcements/${announcementId}`);
        await announcementRef.set(newAnnouncement);

        console.log(`✅ [Announcements API] New announcement created: ${announcementId}`);

        return NextResponse.json(newAnnouncement, { status: 201 });

    } catch (error) {
        console.error('💥 [Announcements API] POST Error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}