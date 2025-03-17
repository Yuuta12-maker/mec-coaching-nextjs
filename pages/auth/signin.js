import { useState, useEffect } from 'react';
import { signIn, getCsrfToken, getProviders, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignIn({ csrfToken, providers }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { data: session } = useSession();
  const router = useRouter();
  
  // エラーがある場合
  useEffect(() => {
    if (router.query.error) {
      setError(router.query.error);
    }
  }, [router.query]);
  
  // 既にログインしている場合
  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  const handleSignIn = async (providerId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('ログイン試行...');
      
      // リダイレクトURLを明示的に指定してサインイン
      const result = await signIn(providerId, { 
        callbackUrl: `${window.location.origin}`,
        redirect: true
      });
      
      console.log('ログイン結果:', result);
      
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('サインインエラー:', error);
      setError('認証中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  // エラーメッセージを表示
  const renderErrorMessage = () => {
    if (!error) return null;
    
    let message = '認証中にエラーが発生しました';
    
    switch (error) {
      case 'AccessDenied':
        message = 'アクセスが拒否されました。許可されたメールアドレスでログインしてください。';
        break;
      case 'Configuration':
        message = '認証の設定に問題があります。システム管理者に連絡してください。';
        break;
      case 'OAuthCallback':
        message = '認証コールバックでエラーが発生しました。';
        break;
      default:
        if (typeof error === 'string') {
          message = error;
        }
    }
    
    return (
      <div className="my-4 p-3 bg-red-100 text-red-700 rounded-md">
        {message}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>ログイン | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#c50502]">
            マインドエンジニアリング・コーチング
          </h1>
          <p className="text-gray-600 mt-2">業務管理システム</p>
        </div>
        
        {renderErrorMessage()}
        
        <button
          type="button"
          onClick={() => handleSignIn('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md py-3 px-4 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c50502] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
          ) : (
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
                fill="#FFC107"
              />
              <path
                d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z"
                fill="#FF3D00"
              />
              <path
                d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5717 17.5742 13.3037 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z"
                fill="#4CAF50"
              />
              <path
                d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.785L18.7045 19.404C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
                fill="#1976D2"
              />
            </svg>
          )}
          Googleアカウントでログイン
        </button>
        
        <div className="mt-6 text-sm text-center text-gray-500">
          <p>このシステムは管理者専用です</p>
        </div>
        
        <div className="mt-4 text-center">
          <Link href="/auth/simple" className="text-sm text-[#c50502] hover:underline">
            緊急アクセスモードを使用する
          </Link>
        </div>
        
        <div className="mt-8 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <p>デバッグ情報:</p>
          <p>環境: {process.env.NODE_ENV}</p>
          <p>ホスト: {typeof window !== 'undefined' ? window.location.host : 'SSR'}</p>
          <p>NextAuth URL: {process.env.NEXTAUTH_URL || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const providers = await getProviders();
  return {
    props: {
      csrfToken: await getCsrfToken(context),
      providers: providers || {},
    },
  };
}