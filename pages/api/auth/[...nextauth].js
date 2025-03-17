import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// 許可されたメールアドレス（後で環境変数に移動する）
const ALLOWED_EMAILS = [
  'mindengineeringcoaching@gmail.com',
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
};

export default NextAuth(authOptions);