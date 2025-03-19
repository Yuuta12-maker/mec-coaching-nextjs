import '../styles/globals.css';
import { SessionProvider, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// 認証が必要なページのラッパー
function Auth({ children }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();
  
  // 認証されていない場合、サインインページにリダイレクト
  useEffect(() => {
    if (!loading && !session && 
        !router.pathname.startsWith('/auth/') && 
        router.pathname !== '/_error') {
      router.push('/auth/signin');
    }
  }, [session, loading, router]);
  
  // ローディング中表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full animate-spin" 
             style={{ borderTopColor: '#c50502' }}></div>
      </div>
    );
  }
  
  // 認証されていない場合は何も表示しない（リダイレクト中）
  if (!session && 
      !router.pathname.startsWith('/auth/') && 
      router.pathname !== '/_error') {
    return null;
  }
  
  // 子コンポーネントを表示（認証済み、または認証不要のページ）
  return children;
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // 認証が不要なページのパスを指定
  const authExempt = ['/auth/signin', '/auth/error', '/auth/bypass', '/auth/simple'];
  const router = useRouter();
  
  // 現在のページが認証免除かどうかをチェック
  const isAuthExempt = authExempt.includes(router.pathname);
  
  // ダークモード設定を読み込み、適用
  useEffect(() => {
    // ブラウザ環境でのみ実行
    if (typeof window !== 'undefined') {
      // 保存されたテーマ設定を確認
      const savedTheme = localStorage.getItem('mec-theme');
      
      if (savedTheme === 'dark') {
        // ダークモードが保存されていれば適用
        document.documentElement.classList.add('dark');
      } else if (savedTheme === 'light') {
        // ライトモードが保存されていれば適用
        document.documentElement.classList.remove('dark');
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // 保存された設定がなければシステム設定を確認
        document.documentElement.classList.add('dark');
        localStorage.setItem('mec-theme', 'dark');
      }
      
      // システム設定の変更を監視
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        // ユーザーが明示的に設定していない場合のみシステム設定に従う
        if (!localStorage.getItem('mec-theme')) {
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      };
      
      // 変更イベントのリスナーを追加
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // 古いブラウザ向けの処理
        mediaQuery.addListener(handleChange);
      }
      
      // クリーンアップ関数
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, []);
  
  return (
    <SessionProvider session={session}>
      <Head>
        <title>マインドエンジニアリング・コーチング</title>
        <meta name="description" content="マインドエンジニアリング・コーチング業務管理システム" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {isAuthExempt ? (
        // 認証が不要なページはそのまま表示
        <Component {...pageProps} />
      ) : (
        // 認証が必要なページは認証チェックを行う
        <Auth>
          <Component {...pageProps} />
        </Auth>
      )}
    </SessionProvider>
  );
}

export default MyApp;