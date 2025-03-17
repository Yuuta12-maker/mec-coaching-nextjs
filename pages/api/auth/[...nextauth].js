import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// 許可されたメールアドレス（後で環境変数に移動する）
const ALLOWED_EMAILS = [
  'mindengineeringcoaching@gmail.com',
  'anosubarasiiaiwomouitido_honor@yahoo.co.jp',
  // 他の許可するメールアドレスがあればここに追加
];

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 開発環境では認証をバイパス（開発環境で迅速にテストできるように）
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      
      // 特定のメールアドレスのみ許可
      return ALLOWED_EMAILS.includes(user.email);
    },
    async session({ session, token, user }) {
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'THIS_IS_AN_EXAMPLE_SECRET_REPLACE_IN_PRODUCTION',
  // ホスト設定
  trustHost: true,
};

export default NextAuth(authOptions);