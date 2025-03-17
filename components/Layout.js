import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

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
  
  // 緊急対応：認証チェックを一時的に無効にする
  // // 認証されておらず、バイパスもない場合は何も表示しない
  // if (status === 'unauthenticated' && !bypassAuth && !forceAccess) {
  //   // 認証関連ページにいる場合はレイアウトを表示しない
  //   if (router.pathname.startsWith('/auth/')) {
  //     return <>{children}</>;
  //   }
  //   return null;
  // }

  return (
    <div className="app-container">
      <div className="min-h-screen flex flex-col">
        {/* トップバー */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between p-4">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-2 text-gray-600" 
              onClick={toggleMobileMenu}
            >
              <span className="material-icons">menu</span>
            </button>
            <span className="text-lg font-medium text-[#c50502]">マインドエンジニアリング・コーチング</span>
          </div>
          
          <div className="flex items-center">
            {bypassAuth && (
              <span className="mr-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">緊急モード</span>
            )}
            {forceAccess && !session && (
              <span className="mr-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">一時アクセスモード</span>
            )}
            <span className="mr-2 hidden sm:block text-sm text-gray-600">
              {session?.user?.name || '管理者'}
            </span>
            <button 
              onClick={handleSignOut}
              className="text-gray-600 hover:text-[#c50502]"
            >
              <span className="material-icons">logout</span>
            </button>
          </div>
        </header>
        
        {/* デスクトップナビゲーション（PC用） */}
        <div className="hidden md:flex justify-center border-b border-gray-200 bg-white">
          <nav className="flex">
            <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <span className="material-icons">dashboard</span>
              <span>ダッシュボード</span>
            </Link>
            <Link href="/clients" className={`nav-link ${isActive('/clients') ? 'active' : ''}`}>
              <span className="material-icons">people</span>
              <span>クライアント</span>
            </Link>
            <Link href="/sessions" className={`nav-link ${isActive('/sessions') ? 'active' : ''}`}>
              <span className="material-icons">event</span>
              <span>セッション</span>
            </Link>
            <Link href="/payments" className={`nav-link ${isActive('/payments') ? 'active' : ''}`}>
              <span className="material-icons">payments</span>
              <span>支払い</span>
            </Link>
          </nav>
        </div>
        
        {/* メインコンテンツ */}
        <main className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* モバイルメニュー */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`} onClick={toggleMobileMenu}>
        <div 
          className={`fixed top-0 right-0 w-64 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-[#c50502] font-bold">MEC</h2>
            <button onClick={toggleMobileMenu} className="text-gray-600">
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <nav className="flex flex-col py-4">
            <Link href="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <span className="material-icons">dashboard</span>
              <span>ダッシュボード</span>
            </Link>
            <Link href="/clients" className={`mobile-nav-link ${isActive('/clients') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <span className="material-icons">people</span>
              <span>クライアント</span>
            </Link>
            <Link href="/sessions" className={`mobile-nav-link ${isActive('/sessions') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <span className="material-icons">event</span>
              <span>セッション</span>
            </Link>
            <Link href="/payments" className={`mobile-nav-link ${isActive('/payments') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <span className="material-icons">payments</span>
              <span>支払い</span>
            </Link>
          </nav>
          
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {session?.user?.name || '管理者'}
                {bypassAuth && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">緊急モード</span>}
                {forceAccess && !session && <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">一時アクセス</span>}
              </div>
              <button 
                onClick={handleSignOut}
                className="text-gray-600 hover:text-[#c50502]"
              >
                <span className="material-icons">logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .nav-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          color: #4b5563;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .nav-link .material-icons {
          margin-right: 0.5rem;
          font-size: 1.25rem;
        }
        
        .nav-link:hover {
          color: #c50502;
          background-color: #f9fafb;
        }
        
        .nav-link.active {
          color: #c50502;
          border-bottom: 2px solid #c50502;
        }
        
        .mobile-nav-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          color: #4b5563;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        
        .mobile-nav-link .material-icons {
          margin-right: 0.75rem;
          font-size: 1.25rem;
        }
        
        .mobile-nav-link:hover {
          background-color: #f9fafb;
        }
        
        .mobile-nav-link.active {
          color: #c50502;
          background-color: #f9fafb;
          border-left: 4px solid #c50502;
        }
      `}</style>
    </div>
  );
}