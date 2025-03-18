import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { formatDate, formatCurrency } from '../../lib/utils';

export default function PaymentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();

  const [payment, setPayment] = useState(null);
  const [clientName, setClientName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    金額: '',
    項目: '',
    備考: '',
    状態: '',
    入金日: ''
  });

  // 支払い情報を取得
  useEffect(() => {
    if (!id) return;

    async function fetchPayment() {
      try {
        setLoading(true);
        setError(null);

        // 支払い詳細を取得
        const response = await fetch(`/api/payments/${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '支払い情報の取得に失敗しました');
        }

        const data = await response.json();
        setPayment(data);
        
        // フォームデータを初期化
        setFormData({
          金額: data.金額 || '',
          項目: data.項目 || '',
          備考: data.備考 || '',
          状態: data.状態 || '',
          入金日: data.入金日 || ''
        });

        // クライアント名を取得（あれば）
        if (data.クライアントID) {
          try {
            const clientResponse = await fetch(`/api/clients/${data.クライアントID}`);
            if (clientResponse.ok) {
              const clientData = await clientResponse.json();
              setClientName(clientData.client?.お名前 || '不明なクライアント');
            }
          } catch (clientErr) {
            console.error('クライアント情報取得エラー:', clientErr);
            // クライアント情報取得失敗は致命的エラーにしない
          }
        }
      } catch (err) {
        console.error('支払い情報取得エラー:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPayment();
  }, [id]);

  // フォーム入力の変更を処理
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 支払い情報を更新
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // 金額を数値に変換
      const updatedData = { 
        ...formData,
        金額: formData.金額 ? parseInt(formData.金額, 10) : formData.金額
      };
      
      // 状態が入金済みに変更され、入金日が設定されていない場合は今日の日付を設定
      if (updatedData.状態 === '入金済み' && !updatedData.入金日) {
        const today = new Date();
        updatedData.入金日 = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
      }
      
      const response = await fetch(`/api/payments/${id}`, {
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
      const updatedPayment = { ...payment, ...updatedData };
      setPayment(updatedPayment);
      setIsEditing(false);
      
      // 成功メッセージを表示
      alert('支払い情報を更新しました');
    } catch (err) {
      console.error('支払い更新エラー:', err);
      alert('更新に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 入金確認（状態を更新）
  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const response = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          状態: '入金済み',
          入金日: today.toISOString().split('T')[0] // YYYY-MM-DD形式
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '入金確認の処理に失敗しました');
      }

      // 更新成功
      setPayment({
        ...payment,
        状態: '入金済み',
        入金日: today.toISOString().split('T')[0]
      });
      
      // フォームデータも更新
      setFormData({
        ...formData,
        状態: '入金済み',
        入金日: today.toISOString().split('T')[0]
      });
      
      // 成功メッセージを表示
      alert('入金を確認しました');
    } catch (err) {
      console.error('入金確認エラー:', err);
      alert('入金確認に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ローディング表示
  if (loading && !payment) {
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
  if (error && !payment) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">エラーが発生しました</h3>
          <p>{error}</p>
        </div>
        <Link href="/payments" className="text-[#c50502] hover:underline">
          支払い一覧に戻る
        </Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>
          {payment ? `${payment.項目 || '支払い詳細'} | 支払い管理` : '支払い詳細'}
          | マインドエンジニアリング・コーチング
        </title>
      </Head>

      {/* ヘッダー部分 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/payments" className="text-[#c50502] hover:underline">
              支払い一覧
            </Link>
            <span className="text-gray-500">&gt;</span>
            <h1 className="text-xl font-bold text-gray-800">
              {payment?.項目 || '支払い詳細'}
            </h1>
          </div>
          {payment && (
            <p className="text-gray-600">
              {formatCurrency(payment.金額)} | {payment.状態 || '状態未設定'}
            </p>
          )}
        </div>
        <div className="mt-2 md:mt-0 flex gap-2">
          {payment && payment.状態 === '未入金' && !isEditing && (
            <button
              onClick={handleConfirmPayment}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              disabled={loading}
            >
              入金確認
            </button>
          )}
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-[#c50502] hover:bg-[#a00401] text-white px-4 py-2 rounded-md text-sm"
              disabled={loading}
            >
              編集
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm"
              disabled={loading}
            >
              キャンセル
            </button>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 項目 */}
              <div>
                <label htmlFor="項目" className="block text-sm font-medium text-gray-700 mb-1">
                  項目
                </label>
                <select
                  id="項目"
                  name="項目"
                  value={formData.項目}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
                  required
                >
                  <option value="">選択してください</option>
                  <option value="トライアル">トライアル</option>
                  <option value="継続セッション">継続セッション</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              
              {/* 金額 */}
              <div>
                <label htmlFor="金額" className="block text-sm font-medium text-gray-700 mb-1">
                  金額
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
                  状態
                </label>
                <select
                  id="状態"
                  name="状態"
                  value={formData.状態}
                  onChange={handleChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
                  required
                >
                  <option value="">選択してください</option>
                  <option value="未入金">未入金</option>
                  <option value="入金済み">入金済み</option>
                </select>
              </div>
              
              {/* 入金日（状態が入金済みの場合のみ表示） */}
              {formData.状態 === '入金済み' && (
                <div>
                  <label htmlFor="入金日" className="block text-sm font-medium text-gray-700 mb-1">
                    入金日
                  </label>
                  <input
                    type="date"
                    id="入金日"
                    name="入金日"
                    value={formData.入金日 || ''}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
                  />
                </div>
              )}
              
              {/* 備考 */}
              <div className="md:col-span-2">
                <label htmlFor="備考" className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  id="備考"
                  name="備考"
                  value={formData.備考 || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
                  placeholder="メモや補足情報があれば入力してください"
                />
              </div>
            </div>
            
            {/* 更新ボタン */}
            <div className="mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-[#c50502] hover:bg-[#a00401] text-white rounded-md text-sm font-medium"
                disabled={loading}
              >
                {loading ? '更新中...' : '支払い情報を更新'}
              </button>
            </div>
          </form>
        ) : (
          // 詳細表示
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              {/* クライアント情報 */}
              <div className="border-b md:border-b-0 pb-4 md:pb-0">
                <dt className="text-sm font-medium text-gray-500">クライアント</dt>
                <dd className="mt-1">
                  {clientName ? (
                    <Link href={`/clients/${payment.クライアントID}`} className="text-[#c50502] hover:underline">
                      {clientName}
                    </Link>
                  ) : (
                    <span className="text-gray-900">不明なクライアント</span>
                  )}
                  <div className="text-xs text-gray-500">{payment.クライアントID}</div>
                </dd>
              </div>
              
              {/* 項目 */}
              <div className="border-b md:border-b-0 pb-4 md:pb-0">
                <dt className="text-sm font-medium text-gray-500">項目</dt>
                <dd className="mt-1 text-gray-900">{payment.項目 || '未設定'}</dd>
              </div>
              
              {/* 金額 */}
              <div className="border-b md:border-b-0 pb-4 md:pb-0">
                <dt className="text-sm font-medium text-gray-500">金額</dt>
                <dd className="mt-1 text-gray-900 font-bold">{formatCurrency(payment.金額)}</dd>
              </div>
              
              {/* 状態 */}
              <div className="border-b md:border-b-0 pb-4 md:pb-0">
                <dt className="text-sm font-medium text-gray-500">状態</dt>
                <dd className="mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${payment.状態 === '入金済み' ? 'bg-green-100 text-green-800' : 
                      payment.状態 === '未入金' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}
                  >
                    {payment.状態 || '未設定'}
                  </span>
                </dd>
              </div>
              
              {/* 登録日 */}
              <div className="border-b md:border-b-0 pb-4 md:pb-0">
                <dt className="text-sm font-medium text-gray-500">登録日</dt>
                <dd className="mt-1 text-gray-900">
                  {payment.登録日 ? formatDate(payment.登録日, 'yyyy年MM月dd日') : '未設定'}
                </dd>
              </div>
              
              {/* 入金日 */}
              <div className="border-b md:border-b-0 pb-4 md:pb-0">
                <dt className="text-sm font-medium text-gray-500">入金日</dt>
                <dd className="mt-1 text-gray-900">
                  {payment.入金日 ? formatDate(payment.入金日, 'yyyy年MM月dd日') : '未設定'}
                </dd>
              </div>
              
              {/* 備考 */}
              <div className="md:col-span-2 border-b pb-4 md:pb-0">
                <dt className="text-sm font-medium text-gray-500">備考</dt>
                <dd className="mt-1 text-gray-900 whitespace-pre-line">
                  {payment.備考 || '特になし'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </Layout>
  );
}
