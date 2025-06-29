import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { database } from '@/lib/firebase-rest';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log(`⚔️ [Clan Detail API] GET request for clan ${params.id}`);

        const clanRef = database.ref(`clans/${params.id}`);
        const snapshot = await clanRef.get();

        if (!snapshot.exists()) {
            return NextResponse.json({ 
                error: 'Not Found', 
                message: 'Klan bulunamadı' 
            }, { status: 404 });
        }

        const clanData = snapshot.val();

        // Check if clan is public or user has access
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!clanData.isPublic && !clanData.members.some((m: any) => m.userId === userId)) {
            return NextResponse.json({ 
                error: 'Forbidden', 
                message: 'Bu klana erişim yetkiniz yok' 
            }, { status: 403 });
        }

        console.log(`✅ [Clan Detail API] Returning clan data for ${params.id}`);

        return NextResponse.json(clanData);

    } catch (error) {
        console.error(`💥 [Clan Detail API] GET Error for clan ${params.id}:`, error);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        console.log(`⚔️ [Clan Detail API] PUT request for clan ${params.id}`);
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clanRef = database.ref(`clans/${params.id}`);
        const snapshot = await clanRef.get();

        if (!snapshot.exists()) {
            return NextResponse.json({ 
                error: 'Not Found', 
                message: 'Klan bulunamadı' 
            }, { status: 404 });
        }

        const clanData = snapshot.val();
        const userId = session.user.id;

        // Check if user has permission to edit clan (founder or leader)
        const userMember = clanData.members.find((m: any) => m.userId === userId);
        const canEdit = userMember && ['founder', 'leader'].includes(userMember.role);

        if (!canEdit) {
            return NextResponse.json({ 
                error: 'Forbidden', 
                message: 'Klanı düzenleme yetkiniz yok' 
            }, { status: 403 });
        }

        const body = await request.json();\n        const { action, data } = body;\n\n        if (!action) {\n            return NextResponse.json({ \n                error: 'Bad Request', \n                message: 'Eylem belirtilmedi' \n            }, { status: 400 });\n        }\n\n        let updateData: any = {\n            updatedAt: { '.sv': 'timestamp' }\n        };\n\n        switch (action) {\n            case 'updateInfo':\n                if (data.name) updateData.name = data.name;\n                if (data.description) updateData.description = data.description;\n                if (data.banner) updateData.banner = data.banner;\n                if (data.logo) updateData.logo = data.logo;\n                if (data.socialLinks) updateData.socialLinks = data.socialLinks;\n                break;\n\n            case 'updateRequirements':\n                if (data.requirements) {\n                    updateData.requirements = {\n                        ...clanData.requirements,\n                        ...data.requirements\n                    };\n                }\n                break;\n\n            case 'updateSettings':\n                if (typeof data.isPublic === 'boolean') updateData.isPublic = data.isPublic;\n                if (typeof data.isRecruiting === 'boolean') updateData.isRecruiting = data.isRecruiting;\n                if (data.maxMembers) updateData.maxMembers = data.maxMembers;\n                break;\n\n            case 'addMember':\n                if (!data.userId) {\n                    return NextResponse.json({ \n                        error: 'Bad Request', \n                        message: 'Kullanıcı ID gereklidir' \n                    }, { status: 400 });\n                }\n\n                // Check if user is already a member\n                const existingMember = clanData.members.find((m: any) => m.userId === data.userId);\n                if (existingMember) {\n                    return NextResponse.json({ \n                        error: 'Conflict', \n                        message: 'Kullanıcı zaten klan üyesi' \n                    }, { status: 409 });\n                }\n\n                // Check member limit\n                if (clanData.memberCount >= clanData.maxMembers) {\n                    return NextResponse.json({ \n                        error: 'Conflict', \n                        message: 'Klan dolu' \n                    }, { status: 409 });\n                }\n\n                const newMember = {\n                    userId: data.userId,\n                    username: data.username || 'Unknown User',\n                    avatar: data.avatar || '',\n                    role: 'member',\n                    joinedAt: Date.now(),\n                    contributionPoints: 0,\n                    status: 'active',\n                    lastActive: Date.now()\n                };\n\n                updateData.members = [...clanData.members, newMember];\n                updateData.memberCount = clanData.memberCount + 1;\n                break;\n\n            case 'removeMember':\n                if (!data.userId) {\n                    return NextResponse.json({ \n                        error: 'Bad Request', \n                        message: 'Kullanıcı ID gereklidir' \n                    }, { status: 400 });\n                }\n\n                // Cannot remove founder\n                const memberToRemove = clanData.members.find((m: any) => m.userId === data.userId);\n                if (memberToRemove?.role === 'founder') {\n                    return NextResponse.json({ \n                        error: 'Forbidden', \n                        message: 'Kurucu üye çıkarılamaz' \n                    }, { status: 403 });\n                }\n\n                updateData.members = clanData.members.filter((m: any) => m.userId !== data.userId);\n                updateData.memberCount = Math.max(0, clanData.memberCount - 1);\n                \n                // Remove from leaders if applicable\n                if (clanData.leaders.includes(data.userId)) {\n                    updateData.leaders = clanData.leaders.filter((id: string) => id !== data.userId);\n                }\n                break;\n\n            case 'updateMemberRole':\n                if (!data.userId || !data.role) {\n                    return NextResponse.json({ \n                        error: 'Bad Request', \n                        message: 'Kullanıcı ID ve rol gereklidir' \n                    }, { status: 400 });\n                }\n\n                // Cannot change founder role\n                const memberToUpdate = clanData.members.find((m: any) => m.userId === data.userId);\n                if (memberToUpdate?.role === 'founder' || data.role === 'founder') {\n                    return NextResponse.json({ \n                        error: 'Forbidden', \n                        message: 'Kurucu rolü değiştirilemez' \n                    }, { status: 403 });\n                }\n\n                updateData.members = clanData.members.map((m: any) => {\n                    if (m.userId === data.userId) {\n                        return { ...m, role: data.role };\n                    }\n                    return m;\n                });\n\n                // Update leaders array\n                let newLeaders = [...clanData.leaders];\n                if (data.role === 'leader' && !newLeaders.includes(data.userId)) {\n                    newLeaders.push(data.userId);\n                } else if (data.role !== 'leader' && newLeaders.includes(data.userId)) {\n                    newLeaders = newLeaders.filter(id => id !== data.userId);\n                }\n                updateData.leaders = newLeaders;\n                break;\n\n            case 'updateStats':\n                if (data.stats) {\n                    updateData.stats = {\n                        ...clanData.stats,\n                        ...data.stats\n                    };\n                    \n                    // Recalculate win rate\n                    if (updateData.stats.totalMatches > 0) {\n                        updateData.stats.winRate = Math.round(\n                            (updateData.stats.wins / updateData.stats.totalMatches) * 100 * 10\n                        ) / 10;\n                    }\n                }\n                break;\n\n            case 'addAchievement':\n                if (data.achievement && !clanData.achievements.includes(data.achievement)) {\n                    updateData.achievements = [...clanData.achievements, data.achievement];\n                }\n                break;\n\n            case 'removeAchievement':\n                if (data.achievement) {\n                    updateData.achievements = clanData.achievements.filter(\n                        (a: string) => a !== data.achievement\n                    );\n                }\n                break;\n\n            default:\n                return NextResponse.json({ \n                    error: 'Bad Request', \n                    message: 'Geçersiz eylem' \n                }, { status: 400 });\n        }\n\n        await clanRef.update(updateData);\n\n        // Get updated clan data\n        const updatedSnapshot = await clanRef.get();\n        const updatedClan = updatedSnapshot.val();\n\n        console.log(`✅ [Clan Detail API] Updated clan ${params.id}`);\n\n        return NextResponse.json({\n            success: true,\n            message: 'Klan başarıyla güncellendi',\n            clan: updatedClan\n        });\n\n    } catch (error) {\n        console.error(`💥 [Clan Detail API] PUT Error for clan ${params.id}:`, error);\n        return NextResponse.json({ \n            error: 'Internal server error',\n            message: error instanceof Error ? error.message : 'Unknown error'\n        }, { status: 500 });\n    }\n}\n\nexport async function DELETE(\n    request: NextRequest,\n    { params }: { params: { id: string } }\n) {\n    try {\n        console.log(`⚔️ [Clan Detail API] DELETE request for clan ${params.id}`);\n        const session = await getServerSession(authOptions);\n\n        if (!session || !session.user) {\n            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n        }\n\n        const clanRef = database.ref(`clans/${params.id}`);\n        const snapshot = await clanRef.get();\n\n        if (!snapshot.exists()) {\n            return NextResponse.json({ \n                error: 'Not Found', \n                message: 'Klan bulunamadı' \n            }, { status: 404 });\n        }\n\n        const clanData = snapshot.val();\n        const userId = session.user.id;\n\n        // Only founder can delete clan\n        const isFounder = clanData.founder.id === userId;\n        if (!isFounder) {\n            return NextResponse.json({ \n                error: 'Forbidden', \n                message: 'Sadece kurucu klanı silebilir' \n            }, { status: 403 });\n        }\n\n        // Mark as inactive instead of deleting (soft delete)\n        await clanRef.update({\n            isActive: false,\n            deletedAt: { '.sv': 'timestamp' },\n            deletedBy: userId,\n            updatedAt: { '.sv': 'timestamp' }\n        });\n\n        console.log(`✅ [Clan Detail API] Deleted clan ${params.id}`);\n\n        return NextResponse.json({\n            success: true,\n            message: 'Klan başarıyla silindi'\n        });\n\n    } catch (error) {\n        console.error(`💥 [Clan Detail API] DELETE Error for clan ${params.id}:`, error);\n        return NextResponse.json({ \n            error: 'Internal server error',\n            message: error instanceof Error ? error.message : 'Unknown error'\n        }, { status: 500 });\n    }\n}