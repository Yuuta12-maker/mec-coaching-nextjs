import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Firestore初期化は不要になりました（ローカルストレージ方式に移行）
  useEffect(() => {
    // システム初期化処理（必要に応じて）
    const setupApp = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('アプリケーション初期化中...');
        }
        // Google Sheets API接続テストなどの処理があればここに
        if (process.env.NODE_ENV === 'development') {
          console.log('アプリケーション初期化完了');
        }
      } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
      }
    };

    setupApp();
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;