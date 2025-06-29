import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { adminDatabase } from './firebase-admin';

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'identify email guilds guilds.members.read',
                },
            },
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'discord' && profile) {
                try {
                    // Discord kullanıcı bilgilerini Firebase'e kaydet
                    const userRef = adminDatabase.ref(`users/${user.id}`);
                    const userSnapshot = await userRef.get();

                    const userData: any = {
                        id: user.id,
                        discordId: profile.id,
                        username: profile.username,
                        discriminator: profile.discriminator || '0000',
                        avatar: profile.avatar,
                        email: profile.email,
                        roles: [], // Discord sunucu rollerini almak için ayrı API çağrısı gerekli
                        permissions: [],
                        lastSeen: { '.sv': 'timestamp' },
                        isOnline: true,
                        updatedAt: { '.sv': 'timestamp' },
                    };

                    // Eğer kullanıcı yeni ise joinedAt ekle
                    if (!userSnapshot.exists()) {
                        userData.joinedAt = { '.sv': 'timestamp' };
                    }

                    await userRef.set(userData);

                    return true;
                } catch (error) {
                    console.error('Error saving user to Firebase:', error);
                    return false;
                }
            }
            return true;
        },

        async session({ session, token }) {
            if (session.user && token.sub) {
                // Firebase'den kullanıcı bilgilerini al
                try {
                    const userRef = adminDatabase.ref(`users/${token.sub}`);
                    const userSnapshot = await userRef.get();

                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.val();
                        session.user.id = token.sub;
                        session.user.discordId = userData.discordId;
                        session.user.roles = userData.roles || [];
                        session.user.permissions = userData.permissions || [];

                        // Avatar URL'sini oluştur
                        if (userData.avatar) {
                            session.user.image = userData.avatar.startsWith('a_')
                                ? `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.avatar}.gif?size=512`
                                : `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.avatar}.png?size=512`;
                        } else {
                            session.user.image = `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discordId) % 5}.png`;
                        }

                        // Username'i name olarak ata
                        session.user.name = userData.username || session.user.name;
                    }
                } catch (error) {
                    console.error('Error fetching user from Firebase:', error);
                }

                // JWT token'dan accessToken'ı session'a aktar
                session.accessToken = token.accessToken as string;
            }
            return session;
        },

        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.discordId = profile.id;
                token.accessToken = account.access_token || '';
            }
            return token;
        },
    },

    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },

    session: {
        strategy: 'jwt',
    },

    secret: process.env.NEXTAUTH_SECRET,
}; 