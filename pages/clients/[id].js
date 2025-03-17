import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import ClientDetail from '../../components/clients/ClientDetail';

export default function ClientDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  return (
    <Layout>
      <Head>
        <title>クライアント詳細 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Link href="/clients" className="text-primary-600 hover:text-primary-800">
            クライアント一覧
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-700">詳細</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">クライアント詳細</h1>
      </div>
      
      {id ? (
        <ClientDetail clientId={id} />
      ) : (
        <div className="text-center py-8">
          <div className="spinner"></div>
        </div>
      )}
    </Layout>
  );
}

// サーバーサイドで認証を確認
export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=' + encodeURIComponent(context.resolvedUrl),
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
}