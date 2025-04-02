import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ClientDetail from '../../components/clients/ClientDetail';
import ClientEditForm from '../../components/clients/ClientEditForm';
import ClientSessions from '../../components/clients/ClientSessions';
import ClientPayments from '../../components/clients/ClientPayments';

export default function ClientPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // クライアント情報を取得
  useEffect(() => {
    if (!id) return;

    async function fetchClientData() {
      try {
        setLoading(true);
        setError(null);
        
        // クライアント詳細を取得（セッションと支払い情報も含む）
        const response = await fetch(`/api/clients/${id}?withSessions=true&withPayments=true`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'クライアント情報の取得に失敗しました');
        }
        
        const data = await response.json();
        // APIレスポンス構造の検証
        if (data.client) {
          // 新しいAPIレスポンス形式
          setClient(data.client);
          setSessions(data.sessions || []);
          setPayments(data.payments || []);
        } else if (data) {
          // 旧APIレスポンス形式（後方互換性のため）
          console.log('レガシーレスポンス形式を検出');
          setClient(data);
          setSessions([]);
          setPayments([]);
        } else {
          throw new Error('無効なレスポンス形式');
        }
      } catch (err) {
        console.error('クライアントデータ取得エラー:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchClientData();
  }, [id]);

  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/clients/${id}`));
    }
  }, [status, router, id]);

  // クライアント情報の更新処理
  const handleUpdateClient = async (updatedData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新に失敗しました');
      }

      // 更新成功
      setClient({ ...client, ...updatedData });
      setIsEditing(false);
      
      // 成功メッセージを表示（任意）
      alert('クライアント情報を更新しました');
    } catch (err) {
      console.error('クライアント更新エラー:', err);
      setError(err.message);
      alert('更新に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ローディング表示
  if (loading && !client) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  // エラー表示
  if (error && !client) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">エラーが発生しました</h3>
          <p>{error}</p>
        </div>
        <Link href="/clients" className="text-[#c50502] hover:underline">
          クライアント一覧に戻る
        </Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>
          {client ? `${client.お名前} | クライアント詳細` : 'クライアント詳細'}
          | マインドエンジニアリング・コーチング
        </title>
      </Head>

      {/* ヘッダー部分 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/clients" className="text-[#c50502] hover:underline">
              クライアント一覧
            </Link>
            <span className="text-gray-500">&gt;</span>
            <h1 className="text-xl font-bold text-gray-800">
              {client?.お名前 || 'クライアント詳細'}
            </h1>
          </div>
          {client && (
            <p className="text-gray-600">
              {client['お名前　（カナ）']} | ID: {client.クライアントID}
            </p>
          )}
        </div>
        <div className="mt-2 md:mt-0">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#c50502] hover:bg-[#a00401] text-white px-4 py-2 rounded-md text-sm"
            >
              編集
            </button>
          )}
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex -mb-px">
          <button
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-[#c50502] text-[#c50502]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('details')}
          >
            基本情報
          </button>
          <button
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-[#c50502] text-[#c50502]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('sessions')}
          >
            セッション履歴
          </button>
          <button
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payments'
                ? 'border-[#c50502] text-[#c50502]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('payments')}
          >
            支払い履歴
          </button>
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activeTab === 'details' && (
          <>
            {isEditing ? (
              <ClientEditForm
                client={client}
                onSave={handleUpdateClient}
                onCancel={() => setIsEditing(false)}
                loading={loading}
              />
            ) : (
              <ClientDetail client={client} />
            )}
          </>
        )}
        
        {activeTab === 'sessions' && (
          <ClientSessions
            sessions={sessions}
            clientId={id}
            isLoading={loading}
          />
        )}
        
        {activeTab === 'payments' && (
          <ClientPayments
            payments={payments}
            clientId={id}
            isLoading={loading}
          />
        )}
      </div>
    </Layout>
  );
}