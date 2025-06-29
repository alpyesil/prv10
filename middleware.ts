import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        
        // Token kontrolü
        if (!token) {
            const url = new URL('/auth/signin', req.url);
            url.searchParams.set('error', 'SessionRequired');
            url.searchParams.set('callbackUrl', req.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        // Token süresi kontrolü
        if (token.exp && Date.now() >= token.exp * 1000) {
            const url = new URL('/auth/signin', req.url);
            url.searchParams.set('error', 'SessionRequired');
            url.searchParams.set('callbackUrl', req.nextUrl.pathname);
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
    }
);

// Korumalı sayfalar
export const config = {
    matcher: [
        '/messages/:path*',
        '/games/:path*',
        '/profile/:path*',
        '/settings/:path*',
    ]
};