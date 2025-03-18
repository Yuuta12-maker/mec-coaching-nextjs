import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { formatDate, formatCurrency } from '../../lib/utils';

export default function PaymentsList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [searchTerm, setSearchTerm] = useState('');
  const [showDebug, setShowDebug] = useState(false); // デバッグ表示の切り替え

  // 支払い情報を取得
  useEffect(() => {
    async function fetchPayments() {
      try {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
        
        console.log('支払い情報取得を開始');
        const response = await fetch('/api/payments');
        
        // レスポンスのステータスコードとヘッダーを確認
        console.log('レスポンスステータス:', response.status);
        console.log('レスポンスヘッダー:', response.headers);
        
        // レスポンスデータを取得
        const responseData = await response.json();
        console.log('レスポンスデータ:', responseData);
        
        if (!response.ok) {
          // エラーレスポンスを詳細に解析
          throw new Error(responseData.error || '支払い情報の取得に失敗しました');
        }
        
        // データがArray型でなければ調整する
        const paymentsArray = Array.isArray(responseData) ? responseData : [];
        console.log('支払いデータ件数:', paymentsArray.length);
        
        // 支払いデータをセット
        setPayments(paymentsArray);
      } catch (err) {
        console.error('支払い情報取得エラー:', err);
        setError(err.message);
        
        // エラーの詳細情報があれば保存
        if (err.details || err.stack) {
          setErrorDetails({
            details: err.details,
            stack: err.stack
          });
        }
      } finally {
        setLoading(false);
      }
    }

    if (status !== 'loading') {
      fetchPayments();
    }
  }, [status]);

  // 接続テスト実行
  const runConnectionTest = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/test-connection');
      const data = await response.json();
      
      if (response.ok) {
        alert(`接続テスト成功: ${data.message || '接続OK'}`);
      } else {
        alert(`接続テスト失敗: ${data.error || 'エラーが発生しました'}`);
      }
    } catch (err) {
      console.error('接続テストエラー:', err);
      alert(`接続テストエラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 支払い状態を更新する関数
  const handleUpdateStatus = async (paymentId, newStatus) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 状態: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '支払い状態の更新に失敗しました');
      }
      
      // 更新に成功したら、リストを更新
      setPayments(payments.map(payment => 
        payment.支払いID === paymentId ? { ...payment, 状態: newStatus, 入金日: newStatus === '入金済み' ? new Date().toISOString().split('T')[0] : payment.入金日 } : payment
      ));
      
    } catch (err) {
      console.error('支払い状態更新エラー:', err);
      alert('支払い状態の更新に失敗しました: ' + err.message);
    }
  };

  // データを再読み込み
  const handleRefresh = () => {
    if (status !== 'loading') {
      setLoading(true);
      async function fetchPayments() {
        try {
          const response = await fetch('/api/payments');
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '支払い情報の取得に失敗しました');
          }
          
          const data = await response.json();
          // データがArray型でなければ調整する
          const paymentsArray = Array.isArray(data) ? data : [];
          setPayments(paymentsArray);
          setError(null);
          setErrorDetails(null);
        } catch (err) {
          console.error('支払い情報取得エラー:', err);
          setError(err.message);
          
          // エラーの詳細情報があれば保存
          if (err.details || err.stack) {
            setErrorDetails({
              details: err.details,
              stack: err.stack
            });
          }
        } finally {
          setLoading(false);
        }
      }
      fetchPayments();
    }
  };

  // フィルターと検索を適用
  const filteredPayments = payments.filter(payment => {
    // 状態フィルター
    const statusMatch = 
      filter === 'all' ? true : 
      filter === 'paid' ? payment.状態 === '入金済み' : 
      filter === 'unpaid' ? payment.状態 === '未入金' : 
      true;
    
    // 検索語句
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = 
      !searchTerm ? true :
      (payment.項目 && payment.項目.toLowerCase().includes(searchLower)) ||
      (payment.備考 && payment.備考.toLowerCase().includes(searchLower));
    
    return statusMatch && searchMatch;
  });

  // 支払い合計を計算
  const totalAmount = filteredPayments.reduce((sum, payment) => {
    return sum + (parseInt(payment.金額, 10) || 0);
  }, 0);
  
  // 支払い済み/未払い合計を計算
  const paidAmount = filteredPayments
    .filter(payment => payment.状態 === '入金済み')
    .reduce((sum, payment) => {
      return sum + (parseInt(payment.金額, 10) || 0);
    }, 0);
  
  const unpaidAmount = totalAmount - paidAmount;

  return (
    <Layout>
      <Head>
        <title>支払い管理 | マインドエンジニアリング・コーチング</title>
      </Head>

      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">支払い管理</h1>
          <p className="text-gray-600">入金状況の確認と支払い記録の管理</p>
        </div>
        
        {/* デバッグツール */}
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm"
            disabled={loading}
          >
            再読み込み
          </button>
          <button
            onClick={runConnectionTest}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm"
            disabled={loading}
          >
            接続テスト
          </button>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm"
          >
            {showDebug ? 'デバッグ非表示' : 'デバッグ表示'}
          </button>
        </div>
      </div>

      {/* デバッグ情報 */}
      {showDebug && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-60">
          <h3 className="font-bold mb-2">デバッグ情報:</h3>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>認証:</strong> {session ? '認証済み' : '未認証'}</p>
          <p><strong>データ件数:</strong> {payments.length}</p>
          {error && (
            <p className="text-red-500 mt-2"><strong>エラー:</strong> {error}</p>
          )}
          {errorDetails && (
            <>
              <p className="text-red-500 mt-2"><strong>エラー詳細:</strong></p>
              {errorDetails.details && <p className="text-red-500">{errorDetails.details}</p>}
              {errorDetails.stack && (
                <pre className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded overflow-auto">
                  {errorDetails.stack}
                </pre>
              )}
            </>
          )}
        </div>
      )}

      {/* 支払い概要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* 合計 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">合計</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          <p className="text-sm text-gray-500">全{filteredPayments.length}件</p>
        </div>
        
        {/* 支払い済み */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">支払い済み</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
          <p className="text-sm text-gray-500">
            {filteredPayments.filter(payment => payment.状態 === '入金済み').length}件
          </p>
        </div>
        
        {/* 未払い */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">未払い</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(unpaidAmount)}</p>
          <p className="text-sm text-gray-500">
            {filteredPayments.filter(payment => payment.状態 === '未入金').length}件
          </p>
        </div>
      </div>

      {/* フィルターと検索 */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 sm:items-center">
            {/* 状態フィルター */}
            <label htmlFor="status-filter" className="text-sm text-gray-700 whitespace-nowrap">
              支払い状態:
            </label>
            <select
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
            >
              <option value="all">すべて</option>
              <option value="paid">支払い済み</option>
              <option value="unpaid">未払い</option>
            </select>
          </div>
          
          {/* 検索ボックス */}
          <div className="w-full md:w-1/3">
            <label htmlFor="search" className="sr-only">検索</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-gray-400 text-lg">search</span>
              </div>
              <input
                type="text"
                id="search"
                placeholder="項目や備考で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring focus:ring-[#c50502] focus:ring-opacity-50"
              />
            </div>
          </div>
          
          {/* 新規登録ボタン */}
          <Link
            href="/payments/new"
            className="w-full md:w-auto px-4 py-2 bg-[#c50502] hover:bg-[#a00401] text-white rounded-md text-sm font-medium flex items-center justify-center"
          >
            <span className="material-icons text-lg mr-1">add</span>
            新規支払い登録
          </Link>
        </div>
      </div>

      {/* 支払い一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="spinner"></div>
            <p className="mt-2 text-gray-500">読み込み中...</p>
          </div>
        ) : error && payments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <p className="text-lg font-semibold">エラーが発生しました</p>
              <p>{error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              再読み込み
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">支払い記録がありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    クライアント
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    項目
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    入金日
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">アクション</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment, idx) => (
                  <tr key={payment.支払いID || payment.id || `payment-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.登録日, 'yyyy/MM/dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.クライアント名 || '不明'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.クライアントID || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.項目 || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment.金額)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {payment.状態 === '未入金' ? (
                        <button
                          onClick={() => handleUpdateStatus(payment.支払いID, '入金済み')}
                          className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 hover:bg-green-100 hover:text-green-800 transition-colors"
                        >
                          未入金 → 入金確認
                        </button>
                      ) : payment.状態 === '入金済み' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          入金済み
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {payment.状態 || '未設定'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.入金日 ? formatDate(payment.入金日, 'yyyy/MM/dd') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {payment.支払いID && (
                        <Link
                          href={`/payments/${payment.支払いID}`}
                          className="text-[#c50502] hover:text-[#a00401]"
                        >
                          詳細
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
