import Head from 'next/head';
import { getSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import ClientList from '../../components/clients/ClientList';

export default function ClientsPage() {
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

// サーバーサイドで認証を確認
export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/clients',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
}