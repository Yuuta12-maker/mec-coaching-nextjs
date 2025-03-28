import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { initializeFirestore } from '../lib/firebase/init';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // アプリケーション起動時にFirebase初期化を行う
  useEffect(() => {
    const setupFirebase = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('開発環境でのFirestore初期化を実行します...');
        }
        await initializeFirestore();
        if (process.env.NODE_ENV === 'development') {
          console.log('Firestore初期化が完了しました');
        }
      } catch (error) {
        console.error('Firestore初期化エラー:', error);
      }
    };

    setupFirebase();
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
