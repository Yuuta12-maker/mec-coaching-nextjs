import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getPayments, getClients, formatCurrency, getStatusColorClass } from '../../lib/api-utils';
import { PAYMENT_STATUS } from '../../lib/constants';

export default function Payments() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // APIからデータを取得 - 直接フェッチしてクライアント追加情報を得る
        const response = await fetch('/api/payments?includeClients=true');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API呼び出しエラー: ${response.status}`);
        }
        
        const data = await response.json();
        const paymentsData = data.payments || [];
        const clientsData = data.clients || [];
        
        console.log('支払いデータ取得:', paymentsData?.length || 0, '件');
        console.log('クライアントデータ取得:', clientsData?.length || 0, '件');
        
        // 支払いデータを正規化（状態フィールドの値を統一）
        const normalizedPayments = paymentsData.map(payment => {
          // 状態の正規化
          let status = payment.状態 || '';
          
          // 古い表記を新しい表記に変換
          if (status === '入金済み') status = PAYMENT_STATUS.PAID;
          else if (status === '未払い') status = PAYMENT_STATUS.UNPAID;
          
          return {
            ...payment,
            状態: status
          };
        });
        
        // フロントエンドでクライアント情報を同期
        setPayments(normalizedPayments || []);
        setClients(clientsData || []);
        
        // デバッグ用に、クライアント名が正しく取得できているか確認
        if (normalizedPayments.length > 0) {
          console.log('支払い情報例:', normalizedPayments[0]);
          console.log('クライアント名例:', normalizedPayments[0].クライアント名 || '不明');
        }
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // 支払いステータスでフィルタリングする関数
  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    if (filter === 'paid') return payment.状態 === PAYMENT_STATUS.PAID;
    if (filter === 'unpaid') return payment.状態 === PAYMENT_STATUS.UNPAID;
    return true;
  });

  // クライアントIDから名前を取得する関数
  const getClientName = (clientId, payment) => {
    // 支払いデータにクライアント名が含まれている場合はそれを使用
    if (payment.クライアント名) {
      return payment.クライアント名;
    }
    
    // まとはクライアントリストから探す
    const client = clients.find(c => c.クライアントID === clientId);
    return client ? client.お名前 : '不明';
  };

  // 合計金額を計算
  const totalAmount = payments.reduce((sum, payment) => sum + (payment.金額 || 0), 0);
  const paidAmount = payments
    .filter(payment => payment.状態 === PAYMENT_STATUS.PAID)
    .reduce((sum, payment) => sum + (payment.金額 || 0), 0);
  
  // 月別の売上データを計算
  const getMonthlyRevenue = () => {
    const monthlyData = {};
    
    payments.forEach(payment => {
      if (payment.状態 !== PAYMENT_STATUS.PAID || !payment.入金日) return;
      
      const date = new Date(payment.入金日);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = 0;
      }
      
      monthlyData[yearMonth] += payment.金額 || 0;
    });
    
    // 日付でソートして返す
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearMonth, amount]) => {
        const [year, month] = yearMonth.split('-');
        return {
          label: `${year}年${month}月`,
          amount
        };
      });
  };
  
  const monthlyRevenue = getMonthlyRevenue();

  return (
    <Layout>
      <Head>
        <title>支払い管理 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="page-title">支払い管理</h1>
            <p className="page-description">クライアントの支払い状況を管理します</p>
          </div>
          <div className="mt-3 sm:mt-0">
            <Link href="/payments/new" className="btn btn-primary">
              <span className="material-icons mr-1">add</span>
              新規支払い登録
            </Link>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          <p className="flex items-center">
            <span className="material-icons mr-2 text-red-500">error</span>
            {error}
          </p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            {/* フィルターと支払い一覧 */}
            <div className="card">
              <div className="card-header border-b border-gray-100 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="card-title">支払い一覧</h2>
                  <div className="flex space-x-2">
                    <button 
                      className={`px-3 py-1 text-sm rounded-md ${filter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'}`}
                      onClick={() => setFilter('all')}
                    >
                      すべて
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-md ${filter === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      onClick={() => setFilter('paid')}
                    >
                      入金済
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-md ${filter === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}
                      onClick={() => setFilter('unpaid')}
                    >
                      未入金
                    </button>
                  </div>
                </div>
              </div>
              
              {filteredPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クライアント</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">項目</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入金日</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.map((payment, index) => (
                        <tr key={payment.支払いID || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            <Link href={`/clients/${payment.クライアントID}`} className="text-primary hover:text-primary-dark">
                              {getClientName(payment.クライアントID, payment)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                            {payment.項目}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                            {formatCurrency(payment.金額)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColorClass(payment.状態)}`}>
                              {payment.状態 || PAYMENT_STATUS.UNPAID}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {payment.登録日 ? new Date(payment.登録日).toLocaleDateString('ja-JP') : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {payment.入金日 ? new Date(payment.入金日).toLocaleDateString('ja-JP') : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right flex justify-end gap-2">
                            <Link href={`/payments/${payment.支払いID}`} className="text-primary hover:text-primary-dark">
                              詳細
                            </Link>
                            {payment.状態 === PAYMENT_STATUS.PAID && (
                              <Link 
                                href={{
                                  pathname: '/receipts/create',
                                  query: {
                                    receiptNum: `MEC-${new Date().getFullYear()}-${payment.支払いID.slice(-3)}`,
                                    date: payment.入金日 || new Date().toISOString().split('T')[0],
                                    clientName: getClientName(payment.クライアントID, payment),
                                    amount: payment.金額.toString(),
                                    description: payment.項目,
                                    paymentMethod: '銀行振込'
                                  }
                                }} 
                                className="text-primary hover:text-primary-dark"
                              >
                                領収書
                              </Link>
                            )}
                            {payment.状態 !== PAYMENT_STATUS.PAID && (
                              <button
                                className="text-green-600 hover:text-green-800"
                                onClick={() => {
                                  // 後で入金確認機能を実装
                                  alert('入金確認機能は近日実装予定です！');
                                }}
                              >
                                入金確認
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  該当する支払いデータがありません
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-1">
            {/* 支払い概要 */}
            <div className="card mb-6">
              <div className="card-header">
                <h2 className="card-title">支払い概要</h2>
              </div>
              
              <div className="space-y-3 py-2">
                <div className="flex justify-between items-center px-4 py-2">
                  <span className="text-gray-600">総件数:</span>
                  <span className="text-lg font-semibold">{payments.length}件</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
                  <span className="text-gray-600">総額:</span>
                  <span className="text-lg font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2">
                  <span className="text-gray-600">入金済:</span>
                  <span className="text-lg font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
                  <span className="text-gray-600">未入金:</span>
                  <span className="text-lg font-semibold text-red-600">{formatCurrency(totalAmount - paidAmount)}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-2">
                  <span className="text-gray-600">入金率:</span>
                  <span className="text-lg font-semibold">
                    {totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}%
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/payments/report" className="btn btn-outline w-full">
                  <span className="material-icons mr-1 text-sm">bar_chart</span>
                  レポート表示
                </Link>
              </div>
            </div>
            
            {/* 月別売上 */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">月別売上</h2>
              </div>
              
              {monthlyRevenue.length > 0 ? (
                <div className="space-y-2 py-2">
                  {monthlyRevenue.map((item, index) => (
                    <div key={index} className={`flex justify-between items-center px-4 py-2 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                      <span className="text-gray-600">{item.label}:</span>
                      <span className="text-lg font-semibold">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  入金データがありません
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}