# PRV10 - Discord Topluluk Platformu

Discord topluluğunuz için modern web platformu. Next.js 15, Firebase Realtime Database ve Discord OAuth ile geliştirilmiştir.

## 🚀 Özellikler

- **Discord Authentication**: NextAuth ile Discord OAuth entegrasyonu
- **Real-time Data**: Firebase Realtime Database
- **Modern UI**: Discord temasında responsive tasarım
- **Oyun Yönetimi**: Topluluk oyun planları
- **Duyuru Sistemi**: Rol bazlı duyurular
- **Üye Yönetimi**: Discord rol senkronizasyonu
- **TypeScript**: Type-safe geliştirme

## 🛠️ Kurulum

### 1. Projeyi Klonlayın

```bash
git clone <repo-url>
cd prv10
npm install
```

### 2. Firebase Kurulumu

#### 2.1 Firebase Projesi Oluşturun
1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. "Create a project" tıklayın
3. Proje adını girin (örn: "prv10-discord")
4. Analytics'i etkinleştirin (isteğe bağlı)

#### 2.2 Realtime Database Kurulumu
1. Firebase Console'da "Realtime Database" sekmesine gidin
2. "Create Database" tıklayın
3. Başlangıç modunu seçin (test mode önerilir)
4. Database URL'ini kopyalayın

#### 2.3 Web App Kurulumu
1. Project Overview > "Add app" > Web (</>) ikonuna tıklayın
2. App nickname girin
3. Firebase Hosting'i etkinleştirin (isteğe bağlı)
4. Konfigürasyon değerlerini kopyalayın

#### 2.4 Service Account Key Oluşturun
1. Project Settings > Service Accounts
2. "Generate new private key" tıklayın
3. JSON dosyasını indirin ve güvenli şekilde saklayın

### 3. Discord OAuth Kurulumu

#### 3.1 Discord Application Oluşturun
1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. "New Application" tıklayın
3. Uygulama adını girin

#### 3.2 OAuth2 Ayarları
1. OAuth2 > General sekmesine gidin
2. "Add Redirect" tıklayın
3. Redirect URI: `http://localhost:3000/api/auth/callback/discord`
4. Production için: `https://yourdomain.com/api/auth/callback/discord`

### 4. Environment Variables

`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve değerleri doldurun:

```bash
cp .env.local.example .env.local
```

#### 4.1 Firebase Değerleri (Firebase Console'dan)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

#### 4.2 Firebase Admin Değerleri (Service Account JSON'dan)
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### 4.3 Discord OAuth Değerleri
```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_GUILD_ID=your_discord_server_id
```

#### 4.4 NextAuth Değerleri
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string
```

### 5. Firebase Database Kuralları

Firebase Console'da Realtime Database > Rules sekmesinde:

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "games": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "announcements": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "events": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 6. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## 📁 Proje Yapısı

```
prv10/
├── app/                 # Next.js App Router
│   ├── api/auth/       # NextAuth API routes
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Ana sayfa
├── components/         # React bileşenleri
│   ├── Header/         # Header bileşeni
│   ├── Footer/         # Footer bileşeni
│   ├── Layout/         # Layout wrapper
│   └── providers/      # Context providers
├── lib/                # Utility fonksiyonlar
│   ├── firebase.ts     # Firebase client config
│   ├── firebase-admin.ts # Firebase admin config
│   ├── auth.ts         # NextAuth config
│   └── hooks/          # Custom React hooks
└── types/              # TypeScript type definitions
```

## 🔑 Önemli Notlar

1. **Güvenlik**: `.env.local` dosyasını asla git'e commit etmeyin
2. **Production**: Production'da NEXTAUTH_URL'yi domain'iniz ile değiştirin
3. **Discord Roller**: Discord rol senkronizasyonu için bot token gerekebilir
4. **Database**: Firebase Realtime Database kurallarını production'da güncelleyin

## 🚀 Deployment

### Vercel (Önerilen)

1. Projeyi GitHub'a push edin
2. [Vercel](https://vercel.com)'e gidin ve import edin
3. Environment variables'ları ekleyin
4. Deploy edin

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 📝 API Kullanımı

### Hooks

```tsx
import { useAuth, useGames, useAnnouncements } from '@/lib/hooks';

function MyComponent() {
  const { user, login, logout } = useAuth();
  const { games, createGame, joinGame } = useGames();
  const { announcements } = useAnnouncements();
  
  // Component logic
}
```

### Firebase Admin

```tsx
import { getUserById, createAnnouncement } from '@/lib/firebase-admin';

// Server-side kullanım
const user = await getUserById('user_id');
const announcementId = await createAnnouncement({
  title: 'Yeni Duyuru',
  content: 'İçerik...',
  // ...
});
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
