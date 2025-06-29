"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaExclamationTriangle, FaHome, FaArrowLeft } from "react-icons/fa";

export default function ErrorPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const getErrorMessage = () => {
        switch (error) {
            case "Configuration":
                return "Sunucu yapılandırma hatası. Lütfen yönetici ile iletişime geçin.";
            case "AccessDenied":
                return "Erişim reddedildi. Bu işlem için yetkiniz bulunmuyor.";
            case "Verification":
                return "Doğrulama hatası. Lütfen tekrar giriş yapmayı deneyin.";
            case "OAuthSignin":
                return "Discord ile bağlanırken hata oluştu. Lütfen tekrar deneyin.";
            case "OAuthCallback":
                return "Discord geri çağrısında hata oluştu. Lütfen tekrar deneyin.";
            case "OAuthCreateAccount":
                return "Hesap oluşturulurken hata oluştu. Lütfen tekrar deneyin.";
            case "EmailCreateAccount":
                return "E-posta ile hesap oluşturulamadı.";
            case "Callback":
                return "Geri çağrı hatası. Lütfen tekrar deneyin.";
            case "OAuthAccountNotLinked":
                return "Bu Discord hesabı başka bir hesapla bağlantılı.";
            case "EmailSignin":
                return "E-posta ile giriş yapılamadı.";
            case "CredentialsSignin":
                return "Giriş bilgileri hatalı.";
            case "SessionRequired":
                return "Bu sayfaya erişmek için giriş yapmanız gerekiyor.";
            default:
                return "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                <div className="mb-6">
                    <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Giriş Hatası
                    </h1>
                    <p className="text-gray-400">
                        {getErrorMessage()}
                    </p>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/auth/signin"
                        className="w-full flex items-center justify-center gap-2 bg-discord-purple hover:bg-discord-purple/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        <FaArrowLeft />
                        <span>Tekrar Dene</span>
                    </Link>

                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        <FaHome />
                        <span>Ana Sayfaya Dön</span>
                    </Link>
                </div>

                {error && (
                    <p className="mt-6 text-gray-500 text-xs">
                        Hata kodu: {error}
                    </p>
                )}
            </div>
        </div>
    );
}