import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ClientList from '../../components/clients/ClientList';

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ログインチェック（クライアントサイドでの確認）
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/clients');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading && status !== 'authenticated') {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>クライアント一覧 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">クライアント一覧</h1>
        <p className="text-gray-600">登録済みのクライアント情報を管理します</p>
      </div>
      
      <ClientList />
    </Layout>
  );
}

// getServerSidePropsは削除（クライアント側で認証チェックを行う）