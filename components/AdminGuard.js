import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// 管理者権限が必要なページを保護するためのコンポーネント
const AdminGuard = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);

  useEffect(() => {
    // 緊急バイパス認証をチェック
    if (typeof window !== 'undefined') {
      const hasBypassAuth = localStorage.getItem('mec-bypass-auth') === 'true';
      setBypassAuth(hasBypassAuth);
    }

    // 認証状態をチェック
    const checkAuth = () => {
      if (status === 'loading') return;

      // 緊急バイパス認証がある場合は許可
      if (bypassAuth) {
        setAuthorized(true);
        return;
      }

      // セッションがない場合はログインページへリダイレクト
      if (!session) {
        setAuthorized(false);
        router.push('/auth/signin');
        return;
      }

      // 管理者権限をチェック
      const isAdmin = session?.user?.role === 'admin';
      
      if (isAdmin) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.push('/auth/unauthorized');
      }
    };

    checkAuth();
  }, [status, session, router, bypassAuth]);

  // 認証チェック中は何も表示しない
  if (status === 'loading') {
    return null;
  }

  // 認証されている場合のみ子コンポーネントを表示
  return authorized ? children : null;
};

export default AdminGuard;