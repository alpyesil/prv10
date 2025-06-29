"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaDiscord } from "react-icons/fa";

export default function SignInPage() {
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const errorParam = searchParams.get("error");
        
        if (errorParam === "OAuthCallback") {
            setError("Giriş işlemi iptal edildi.");
        } else if (errorParam === "SessionRequired") {
            setError("Oturumunuzun süresi dolduğu için çıkış yapıldı.");
        } else if (errorParam === "Verification") {
            setError("Doğrulama hatası oluştu. Lütfen tekrar deneyin.");
        } else if (errorParam) {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
    }, [searchParams]);

    const handleSignIn = async () => {
        setLoading(true);
        setError(null);
        
        try {
            await signIn("discord", { 
                callbackUrl: searchParams.get("callbackUrl") || "/" 
            });
        } catch (error) {
            setError("Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-2xl font-bold text-white mb-6 text-center">
                    Giriş Yap
                </h1>
                
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-discord-purple hover:bg-discord-purple/90 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaDiscord className="text-xl" />
                    <span>{loading ? "Yönlendiriliyor..." : "Discord ile Giriş Yap"}</span>
                </button>

                <p className="mt-6 text-center text-gray-400 text-sm">
                    Discord hesabınızla güvenli bir şekilde giriş yapın.
                </p>
            </div>
        </div>
    );
}