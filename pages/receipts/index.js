import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';

// リダイレクト用ページ
export default function ReceiptsIndexPage() {
  const router = useRouter();
  
  // マウント時に領収書作成ページへリダイレクト
  useEffect(() => {
    router.push('/receipts/create');
  }, [router]);
  
  return (
    <Layout>
      <Head>
        <title>領収書管理 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">領収書作成ページにリダイレクトしています...</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #c50502;
          animation: rotate 1s linear infinite;
          margin: 0 auto;
        }
      `}</style>
    </Layout>
  );
}
