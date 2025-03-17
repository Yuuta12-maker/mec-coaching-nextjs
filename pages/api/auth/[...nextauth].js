import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import logger from '@/lib/logger';

// 許可されたメールアドレス（後で環境変数に移動する）
const ALLOWED_EMAILS = [
  'mindengineeringcoaching@gmail.com',
  'anosubarasiiaiwomouitido_honor@yahoo.co.jp',
  // 他の許可するメールアドレスがあればここに追加
];

// NextAuthの設定
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!user?.email) {
          console.error('認証エラー: ユーザーメールアドレスがありません');
          return false;
        }
        
        // 開発環境では認証をバイパス（開発環境で迅速にテストできるように）
        if (process.env.NODE_ENV === 'development') {
          console.log('開発環境: 認証バイパス');
          return true;
        }
        
        // 特定のメールアドレスのみ許可
        const isAllowed = ALLOWED_EMAILS.includes(user.email);
        console.log(`メールアドレス ${user.email} の認証結果: ${isAllowed ? '許可' : '拒否'}`);
        return isAllowed;
      } catch (error) {
        console.error('認証コールバックエラー:', error);
        return false;
      }
    },
    async session({ session, token, user }) {
      try {
        console.log('セッションコールバック実行');
        return session;
      } catch (error) {
        console.error('セッションコールバックエラー:', error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        if (url.startsWith(baseUrl)) {
          console.log(`リダイレクト: ${url}`);
          return url;
        } else if (url.startsWith('/')) {
          console.log(`相対パスリダイレクト: ${baseUrl}${url}`);
          return `${baseUrl}${url}`;
        }
        console.log(`デフォルトリダイレクト: ${baseUrl}`);
        return baseUrl;
      } catch (error) {
        console.error('リダイレクトコールバックエラー:', error);
        return baseUrl;
      }
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'DEFAULT_SECRET_FOR_DEVELOPMENT_ONLY',
  // ホスト設定
  trustHost: true,
  logger: {
    error: (code, metadata) => {
      console.error(`NextAuth エラー: ${code}`, metadata);
    },
    warn: (code) => {
      console.warn(`NextAuth 警告: ${code}`);
    },
    debug: (code, metadata) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`NextAuth デバッグ: ${code}`, metadata);
      }
    },
  },
};

// NextAuthハンドラーをエクスポート
export default NextAuth(authOptions);