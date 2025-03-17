import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// この画面は開発時の認証問題をバイパスするための一時的なものです
// 本番環境では適切なセキュリティ対策を行うことが重要です

export default function AuthBypass() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // 簡易的なパスワード認証（本番環境では適切な認証方法を使用してください）
  const bypassPassword = 'mec-admin-2025';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === bypassPassword) {
      // ローカルストレージにバイパストークンを保存
      localStorage.setItem('mec-bypass-auth', 'true');
      router.push('/');
    } else {
      setError('パスワードが正しくありません');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>緊急アクセス | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">
            緊急アクセス
          </h1>
          <p className="text-gray-600 mt-2">認証システム一時バイパス</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              管理者パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="パスワードを入力"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            緊急アクセス
          </button>
        </form>
        
        <div className="mt-6 text-sm text-center text-gray-500">
          <p>このページは認証システムに問題がある場合の緊急用です</p>
          <p className="mt-2">
            <a href="/auth/signin" className="text-primary hover:underline">
              通常のログイン画面に戻る
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
