import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Error() {
  const router = useRouter();
  const { error } = router.query;

  // エラーメッセージのマッピング
  const errorMessages = {
    Configuration: '認証の設定に問題があります。',
    AccessDenied: 'アクセスが拒否されました。このシステムは管理者専用です。',
    Verification: '認証リンクが無効か期限切れです。',
    Default: '認証中にエラーが発生しました。',
  };

  // エラーメッセージを取得（存在しない場合はデフォルトメッセージ）
  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>認証エラー | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="mt-4 text-xl font-bold text-gray-800">認証エラー</h1>
          <p className="mt-2 text-gray-600">{errorMessage}</p>
        </div>
        
        <div className="mt-6 flex justify-center">
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
