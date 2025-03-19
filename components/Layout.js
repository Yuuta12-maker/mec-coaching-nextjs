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
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* トップバー */}
        <header className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* ロゴとハンバーガーメニュー */}
              <div className="flex items-center">
                <button 
                  className="md:hidden mr-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded-md p-1 hover:bg-gray-100 transition-colors" 
                  onClick={toggleMobileMenu}
                  aria-label="メニューを開く"
                >
                  <span className="material-icons">menu</span>
                </button>
                <Link href="/" className="flex items-center">
                  <div className="mr-2 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white shadow-lg">
                    <span className="font-bold">M</span>
                  </div>
                  <span className="text-lg font-semibold bg-gradient-to-r from-primary to-primary-dark inline-block text-transparent bg-clip-text hover:text-primary transition-colors">
                    マインドエンジニアリング・コーチング
                  </span>
                </Link>
              </div>
              
              {/* ユーザー情報 */}
              <div className="flex items-center">
                {bypassAuth && (
                  <span className="mr-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">緊急モード</span>
                )}
                {forceAccess && !session && (
                  <span className="mr-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">一時アクセスモード</span>
                )}
                
                <div className="flex items-center ml-2">
                  <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full bg-primary-light text-primary mr-2 shadow-sm">
                    <span className="material-icons text-sm">person</span>
                  </div>
                  <span className="hidden sm:block text-sm text-gray-700 font-medium mr-3">
                    {session?.user?.name || '管理者'}
                  </span>
                  <button 
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-primary transition-colors p-1 rounded-full hover:bg-gray-100"
                    aria-label="ログアウト"
                  >
                    <span className="material-icons">logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* スタイリッシュなナビゲーションバー（PC用） */}
        <div className="hidden md:block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <nav className="flex justify-center">
              <Link href="/" className={`fancy-nav-link ${isActive('/') ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <span className="material-icons icon-shadow">dashboard</span>
                  </div>
                </div>
                <span>ダッシュボード</span>
                {isActive('/') && <div className="nav-indicator"></div>}
              </Link>
              <Link href="/clients" className={`fancy-nav-link ${isActive('/clients') ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <span className="material-icons icon-shadow">people</span>
                  </div>
                </div>
                <span>クライアント</span>
                {isActive('/clients') && <div className="nav-indicator"></div>}
              </Link>
              <Link href="/sessions" className={`fancy-nav-link ${isActive('/sessions') ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <span className="material-icons icon-shadow">event</span>
                  </div>
                </div>
                <span>セッション</span>
                {isActive('/sessions') && <div className="nav-indicator"></div>}
              </Link>
              <Link href="/payments" className={`fancy-nav-link ${isActive('/payments') ? 'active' : ''}`}>
                <div className="nav-icon-wrapper">
                  <div className="nav-icon">
                    <span className="material-icons icon-shadow">payments</span>
                  </div>
                </div>
                <span>支払い</span>
                {isActive('/payments') && <div className="nav-indicator"></div>}
              </Link>
            </nav>
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* フッター */}
        <footer className="bg-white border-t border-gray-200 py-4 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
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
          className={`fixed top-0 left-0 w-72 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">M</span>
              </div>
              <h2 className="ml-2 text-white font-semibold">MEC</h2>
            </div>
            <button 
              onClick={toggleMobileMenu} 
              className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="メニューを閉じる"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          
          <nav className="flex flex-col py-4">
            <Link href="/" className={`mobile-fancy-nav-link ${isActive('/') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <div className="flex items-center">
                <div className="mobile-nav-icon">
                  <span className="material-icons">dashboard</span>
                </div>
                <span>ダッシュボード</span>
              </div>
              {isActive('/') && <div className="mobile-nav-indicator"></div>}
            </Link>
            <Link href="/clients" className={`mobile-fancy-nav-link ${isActive('/clients') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <div className="flex items-center">
                <div className="mobile-nav-icon">
                  <span className="material-icons">people</span>
                </div>
                <span>クライアント</span>
              </div>
              {isActive('/clients') && <div className="mobile-nav-indicator"></div>}
            </Link>
            <Link href="/sessions" className={`mobile-fancy-nav-link ${isActive('/sessions') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <div className="flex items-center">
                <div className="mobile-nav-icon">
                  <span className="material-icons">event</span>
                </div>
                <span>セッション</span>
              </div>
              {isActive('/sessions') && <div className="mobile-nav-indicator"></div>}
            </Link>
            <Link href="/payments" className={`mobile-fancy-nav-link ${isActive('/payments') ? 'active' : ''}`} onClick={toggleMobileMenu}>
              <div className="flex items-center">
                <div className="mobile-nav-icon">
                  <span className="material-icons">payments</span>
                </div>
                <span>支払い</span>
              </div>
              {isActive('/payments') && <div className="mobile-nav-indicator"></div>}
            </Link>
          </nav>
          
          <div className="border-t border-gray-700 p-4 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gray-700 text-white flex items-center justify-center mr-2">
                  <span className="material-icons text-sm">person</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    {session?.user?.name || '管理者'}
                  </div>
                  {bypassAuth && <span className="text-xs px-2 py-1 bg-yellow-600 text-yellow-100 rounded mt-1 inline-block">緊急モード</span>}
                  {forceAccess && !session && <span className="text-xs px-2 py-1 bg-red-600 text-red-100 rounded mt-1 inline-block">一時アクセス</span>}
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="ログアウト"
              >
                <span className="material-icons">logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        /* スタイリッシュなナビゲーションリンク */
        .fancy-nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 2.5rem;
          color: #a0aec0;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          height: 4.5rem;
        }
        
        .nav-icon-wrapper {
          position: relative;
          height: 2rem;
          width: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.25rem;
        }
        
        .nav-icon {
          position: relative;
          transform: translateY(0);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .fancy-nav-link .material-icons {
          font-size: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .icon-shadow {
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3));
        }
        
        .fancy-nav-link:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 0;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.1), transparent);
          transition: height 0.3s ease;
        }
        
        .fancy-nav-link:hover {
          color: #ffffff;
        }
        
        .fancy-nav-link:hover:before {
          height: 100%;
        }
        
        .fancy-nav-link:hover .nav-icon {
          transform: translateY(-3px) scale(1.1);
          filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.3));
        }
        
        .fancy-nav-link:hover .material-icons {
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
        }
        
        .fancy-nav-link.active {
          color: #ffffff;
        }
        
        .fancy-nav-link.active:before {
          height: 100%;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
        }
        
        .nav-indicator {
          position: absolute;
          bottom: 0;
          left: 20%;
          width: 60%;
          height: 3px;
          background: linear-gradient(to right, #c50502, #ff6b6b);
          transform: translateX(0);
          border-radius: 3px 3px 0 0;
          box-shadow: 0 0 10px rgba(197, 5, 2, 0.7);
          transition: all 0.3s ease;
        }
        
        /* モバイルナビゲーション */
        .mobile-fancy-nav-link {
          display: block;
          position: relative;
          padding: 1rem 1.5rem;
          color: #e2e8f0;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s;
          margin: 0.5rem;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .mobile-nav-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.75rem;
          transition: all 0.2s ease;
        }
        
        .mobile-fancy-nav-link .material-icons {
          font-size: 1.25rem;
          transition: all 0.2s ease;
        }
        
        .mobile-fancy-nav-link:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to right, rgba(255, 255, 255, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.2s ease;
          border-radius: 0.5rem;
        }
        
        .mobile-fancy-nav-link:hover:before {
          opacity: 1;
        }
        
        .mobile-fancy-nav-link:hover {
          color: #ffffff;
        }
        
        .mobile-fancy-nav-link:hover .material-icons {
          transform: scale(1.1);
        }
        
        .mobile-fancy-nav-link.active {
          background-color: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        
        .mobile-nav-indicator {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(to bottom, #c50502, #ff6b6b);
          border-radius: 0 3px 3px 0;
          box-shadow: 0 0 8px rgba(197, 5, 2, 0.5);
        }
      `}</style>
    </div>
  );
}