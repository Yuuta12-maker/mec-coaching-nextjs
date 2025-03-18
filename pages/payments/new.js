import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';

export default function NewPayment() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { clientId } = router.query; // URLからクライアントIDを取得（任意）
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    クライアントID: '',
    項目: '',
    金額: '',
    状態: '未入金',
    備考: '',
  });
  const [clientData, setClientData] = useState(null); // 選択したクライアントの情報

  // クライアント一覧を取得
  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error('クライアント情報の取得に失敗しました');
        }
        
        const data = await response.json();
        setClients(data.clients || []);
        
        // URLからクライアントIDが指定されていれば、フォームに設定
        if (clientId) {
          setFormData(prev => ({ ...prev, クライアントID: clientId }));
          
          // 該当クライアントの情報も取得
          try {
            const clientResponse = await fetch(`/api/clients/${clientId}`);
            if (clientResponse.ok) {
              const clientData = await clientResponse.json();
              setClientData(clientData.client);
            }
          } catch (clientErr) {
            console.error('クライアント詳細取得エラー:', clientErr);
          }
        }
      } catch (err) {
        console.error('クライアント一覧取得エラー:', err);
        setError(err.message);
      }
    }

    if (status !== 'loading') {
      fetchClients();
    }
  }, [status, clientId]);

  // 選択したクライアントの情報を取得
  const handleClientChange = async (e) => {
    const selectedClientId = e.target.value;
    setFormData({ ...formData, クライアントID: selectedClientId });
    
    if (!selectedClientId) {
      setClientData(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/clients/${selectedClientId}`);
      if (response.ok) {
        const data = await response.json();
        setClientData(data.client);
      } else {
        setClientData(null);
      }
    } catch (err) {
      console.error('クライアント情報取得エラー:', err);
      setClientData(null);
    }
  };

  // フォーム入力の変更を処理
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // プリセット項目の選択
  const handlePresetItem = (preset) => {
    let amount = formData.金額;
    
    if (preset === 'トライアル') {
      amount = '6000';
    } else if (preset === '継続セッション') {
      amount = '214000';
    }
    
    setFormData({
      ...formData,
      項目: preset,
      金額: amount
    });
  };

  // 新規支払い登録
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // フォームデータを準備
      const paymentData = {
        ...formData,
        金額: parseInt(formData.金額, 10),
      };
      
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '支払い登録に失敗しました');
      }
      
      const result = await response.json();
      
      // 成功メッセージを表示
      alert('支払いを登録しました');
      
      // 登録したアイテムの詳細ページへリダイレクト
      router.push(`/payments/${result.paymentId}`);
    } catch (err) {
      console.error('支払い登録エラー:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>新規支払い登録 | マインドエンジニアリング・コーチング</title>
      </Head>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/payments" className="text-[#c50502] hover:underline">
            支払い一覧
          </Link>
          <span className="text-gray-500">&gt;</span>
          <h1 className="text-xl font-bold text-gray-800">新規支払い登録</h1>
        </div>
        <p className="text-gray-600">新しい支払い記録を作成します</p>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          {/* クライアント選択 */}
          <div className="mb-6">
            <label htmlFor="クライアントID" className="block text-sm font-medium text-gray-700 mb-1">
              クライアント <span className="text-red-500">*</span>
            </label>
            <select
              id="クライアントID"
              name="クライアントID"
              value={formData.クライアントID}
              onChange={handleClientChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
              required
            >
              <option value="">クライアントを選択してください</option>
              {clients.map((client) => (
                <option key={client.クライアントID} value={client.クライアントID}>
                  {client.お名前} （{client['お名前　（カナ）'] || 'カナなし'}）
                </option>
              ))}
            </select>
            
            {/* 選択したクライアント情報 */}
            {clientData && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-700">選択中のクライアント</h3>
                <div className="mt-1 text-sm text-gray-600">
                  <p>{clientData.お名前}</p>
                  <p className="text-xs mt-1">ID: {clientData.クライアントID}</p>
                </div>
              </div>
            )}
          </div>

          {/* 項目プリセット */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              項目プリセット
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePresetItem('トライアル')}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                トライアル (¥6,000)
              </button>
              <button
                type="button"
                onClick={() => handlePresetItem('継続セッション')}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                継続セッション (¥214,000)
              </button>
              <button
                type="button"
                onClick={() => handlePresetItem('その他')}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
              >
                その他
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 項目 */}
            <div>
              <label htmlFor="項目" className="block text-sm font-medium text-gray-700 mb-1">
                項目 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="項目"
                name="項目"
                value={formData.項目}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
                placeholder="例: トライアル"
                required
              />
            </div>
            
            {/* 金額 */}
            <div>
              <label htmlFor="金額" className="block text-sm font-medium text-gray-700 mb-1">
                金額 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">¥</span>
                </div>
                <input
                  type="number"
                  id="金額"
                  name="金額"
                  value={formData.金額}
                  onChange={handleChange}
                  className="pl-8 w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
                  placeholder="例: 6000"
                  required
                />
              </div>
            </div>
            
            {/* 状態 */}
            <div>
              <label htmlFor="状態" className="block text-sm font-medium text-gray-700 mb-1">
                状態 <span className="text-red-500">*</span>
              </label>
              <select
                id="状態"
                name="状態"
                value={formData.状態}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
                required
              >
                <option value="未入金">未入金</option>
                <option value="入金済み">入金済み</option>
              </select>
            </div>
            
            {/* 備考 */}
            <div className="md:col-span-2">
              <label htmlFor="備考" className="block text-sm font-medium text-gray-700 mb-1">
                備考
              </label>
              <textarea
                id="備考"
                name="備考"
                value={formData.備考}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
                placeholder="メモや補足情報があれば入力してください"
              />
            </div>
          </div>
          
          {/* 送信ボタン */}
          <div className="mt-8 flex justify-end">
            <Link
              href="/payments"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-[#c50502] hover:bg-[#a00401] text-white rounded-md"
              disabled={loading}
            >
              {loading ? '処理中...' : '支払いを登録'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
