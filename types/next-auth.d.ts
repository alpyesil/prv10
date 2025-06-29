import NextAuth from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            discordId: string
            roles: string[]
            permissions: string[]
        }
        accessToken?: string
    }

    interface User {
        id: string
        discordId: string
        roles: string[]
        permissions: string[]
    }

    interface Profile {
        id: string
        username: string
        discriminator: string
        avatar: string
        email: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        discordId: string
        accessToken: string
    }
} 