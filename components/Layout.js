import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import ThemeToggle from './ui/ThemeToggle';

export default function Layout({ children, forceAccess = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // マウント時にのみクライアントサイドレンダリングを有効にする
  useEffect(() => {
    setIsMounted(true);
    
    // 緊急バイパス認証をチェック
    if (typeof window !== 'undefined') {
      const hasBypassAuth = localStorage.getItem('mec-bypass-auth') === 'true';
      setBypassAuth(hasBypassAuth);
      
      // 認証されていない場合かつバイパスもない場合はログインページへリダイレクト
      if (status === 'unauthenticated' && !hasBypassAuth && !forceAccess) {
        // 既にログイン画面またはエラー画面にいる場合はリダイレクトしない
        if (!router.pathname.startsWith('/auth/')) {
          router.push('/auth/signin');
        }
      }
    }
  }, [status, router, forceAccess]);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // スクロール防止（メニュー表示時）
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  // 現在のパス名に基づいてアクティブなメニュー項目を判断する関数
  const isActive = (path) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  // 認証離脱処理
  const handleSignOut = () => {
    // バイパス認証を使用していた場合はローカルストレージをクリア
    if (bypassAuth && typeof window !== 'undefined') {
      localStorage.removeItem('mec-bypass-auth');
      router.push('/auth/signin');
    } else {
      // 通常のサインアウト
      signOut({ callbackUrl: '/auth/signin' });
    }
  };
  
  if (!isMounted) {
    return null; // クライアントサイドでレンダリングするまで何も表示しない
  }
  
  // 認証チェックを復活させる
  // 認証されておらず、バイパスもない場合は何も表示しない
  if (status === 'unauthenticated' && !bypassAuth && !forceAccess) {
    // 認証関連ページにいる場合はレイアウトを表示しない
    if (router.pathname.startsWith('/auth/')) {
      return <>{children}</>;
    }
    return null;
  }

  return (
    <div className="app-container">
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
        {/* トップバー */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* ロゴとハンバーガーメニュー */}
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-3 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md p-1 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" 
                  onClick={toggleMobileMenu}
                  aria-label="メニューを開く"
                >
                  <span className="material-icons">menu</span>
                </button>
                <Link href="/" className="flex items-center">
                  <span className="text-lg font-semibold text-primary hover:text-primary-dark transition-colors">
                    マインドエンジニアリング・コーチング
                  </span>
                </Link>
              </div>
              
              {/* ユーザー情報 */}
              <div className="flex items-center">
                {bypassAuth && (
                  <span className="mr-2 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded text-xs">緊急モード</span>
                )}
                {forceAccess && !session && (
                  <span className="mr-2 px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded text-xs">一時アクセスモード</span>
                )}
                
                {/* ダークモード切り替えボタン */}
                <div className="mr-2">
                  <ThemeToggle />
                </div>
                
                <div className="flex items-center ml-2">
                  <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full bg-primary-light text-primary mr-2 shadow-sm">
                    <span className="material-icons text-sm">person</span>
                  </div>
                  <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 font-medium mr-3">
                    {session?.user?.name || '管理者'}
                  </span>
                  <button 
                    onClick={handleSignOut}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                    aria-label="ログアウト"
                  >
                    <span className="material-icons">logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* ホワイトベースのナビゲーションバー */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center">
              <Link href="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
                <div className="flex flex-col items-center py-3 px-6">
                  <span className="material-icons text-gray-700 dark:text-gray-300">dashboard</span>
                  <span className="text-xs mt-2 font-medium text-gray-800 dark:text-gray-200">ダッシュボード</span>
                </div>
              </Link>
              <Link href="/clients" className={`nav-item ${isActive('/clients') ? 'active' : ''}`}>
                <div className="flex flex-col items-center py-3 px-6">
                  <span className="material-icons text-gray-700 dark:text-gray-300">people</span>
                  <span className="text-xs mt-2 font-medium text-gray-800 dark:text-gray-200">クライアント</span>
                </div>
              </Link>
              <Link href="/sessions" className={`nav-item ${isActive('/sessions') ? 'active' : ''}`}>
                <div className="flex flex-col items-center py-3 px-6">
                  <span className="material-icons text-gray-700 dark:text-gray-300">event</span>
                  <span className="text-xs mt-2 font-medium text-gray-800 dark:text-gray-200">セッション</span>
                </div>
              </Link>
              <Link href="/payments" className={`nav-item ${isActive('/payments') ? 'active' : ''}`}>
                <div className="flex flex-col items-center py-3 px-6">
                  <span className="material-icons text-gray-700 dark:text-gray-300">payments</span>
                  <span className="text-xs mt-2 font-medium text-gray-800 dark:text-gray-200">支払い</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* フッター */}
        <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} マインドエンジニアリング・コーチング
            </div>
          </div>
        </footer>
      </div>
      
      {/* モバイルメニュー */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={toggleMobileMenu}
      >
        <div 
          className={`fixed top-0 left-0 w-72 h-full bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">M</span>
              </div>
              <h2 className="ml-2 text-primary font-semibold">MEC</h2>
            </div>
            <button 
              onClick={toggleMobileMenu} 
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="メニューを閉じる"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <nav className="flex flex-col py-4">
            <Link href="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <span className="material-icons text-gray-700 dark:text-gray-300">dashboard</span>
              <span className="ml-3 text-gray-800 dark:text-gray-200">ダッシュボード</span>
            </Link>
            <Link href="/clients" className={`mobile-nav-link ${isActive('/clients') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <span className="material-icons text-gray-700 dark:text-gray-300">people</span>
              <span className="ml-3 text-gray-800 dark:text-gray-200">クライアント</span>
            </Link>
            <Link href="/sessions" className={`mobile-nav-link ${isActive('/sessions') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <span className="material-icons text-gray-700 dark:text-gray-300">event</span>
              <span className="ml-3 text-gray-800 dark:text-gray-200">セッション</span>
            </Link>
            <Link href="/payments" className={`mobile-nav-link ${isActive('/payments') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <span className="material-icons text-gray-700 dark:text-gray-300">payments</span>
              <span className="ml-3 text-gray-800 dark:text-gray-200">支払い</span>
            </Link>
          </nav>
          
          <div className="border-t border-gray-200 dark:border-slate-700 p-4 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-light text-primary flex items-center justify-center mr-2">
                  <span className="material-icons text-sm">person</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {session?.user?.name || '管理者'}
                  </div>
                  {bypassAuth && <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded mt-1 inline-block">緊急モード</span>}
                  {forceAccess && !session && <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded mt-1 inline-block">一時アクセス</span>}
                </div>
              </div>
              <div className="flex items-center">
                <ThemeToggle />
                <button 
                  onClick={handleSignOut}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="ログアウト"
                >
                  <span className="material-icons">logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* ナビゲーションアイテム */
        .nav-item {
          display: block;
          position: relative;
          margin: 0 10px;
          transition: all 0.2s ease;
          border-radius: 8px;
        }
        
        .nav-item:hover {
          background-color: #f3f4f6;
        }
        
        .dark .nav-item:hover {
          background-color: #334155;
        }
        
        .nav-item.active {
          background-color: #f0f0f0;
        }
        
        .dark .nav-item.active {
          background-color: #334155;
        }
        
        .nav-item.active:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20%;
          width: 60%;
          height: 3px;
          background-color: var(--primary-color);
          border-radius: 3px 3px 0 0;
        }
        
        .nav-item .material-icons {
          font-size: 1.5rem;
        }
        
        /* モバイルナビゲーション */
        .mobile-nav-link {
          display: flex;
          align-items: center;
          padding: 0.875rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          transition: background-color 0.2s;
          border-radius: 0.5rem;
          margin: 0.25rem 0.5rem;
        }
        
        .mobile-nav-link:hover {
          background-color: #f3f4f6;
        }
        
        .dark .mobile-nav-link:hover {
          background-color: #334155;
        }
        
        .mobile-nav-link.active {
          background-color: #f0f0f0;
          font-weight: 600;
          border-left: 3px solid var(--primary-color);
        }
        
        .dark .mobile-nav-link.active {
          background-color: #334155;
        }
      `}</style>
    </div>
  );
}