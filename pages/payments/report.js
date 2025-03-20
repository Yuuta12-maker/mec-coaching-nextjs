import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getPayments, getClients, formatCurrency } from '../../lib/api-utils';

export default function PaymentReport() {
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'year', 'month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // APIからデータを取得
        const paymentsData = await getPayments();
        const clientsData = await getClients();
        
        console.log('支払いデータ取得:', paymentsData?.length || 0, '件');
        console.log('クライアントデータ取得:', clientsData?.length || 0, '件');
        
        setPayments(paymentsData || []);
        setClients(clientsData || []);
        
        // デフォルトの日付範囲を設定
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        setCustomStartDate(firstDayOfMonth.toISOString().split('T')[0]);
        setCustomEndDate(today.toISOString().split('T')[0]);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError(err.message || 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // クライアントIDから名前を取得する関数
  const getClientName = (clientId) => {
    const client = clients.find(c => c.クライアントID === clientId);
    return client ? client.お名前 : '不明';
  };

  // 日付フィルタリング関数
  const filterPaymentsByDate = (payment) => {
    if (timeRange === 'all') return true;
    
    const paymentDate = payment.入金日 ? new Date(payment.入金日) : null;
    if (!paymentDate) return false;
    
    const now = new Date();
    
    if (timeRange === 'month') {
      // 今月
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return paymentDate >= firstDayOfMonth && paymentDate <= now;
    } else if (timeRange === 'year') {
      // 今年
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      return paymentDate >= firstDayOfYear && paymentDate <= now;
    } else if (timeRange === 'custom') {
      // カスタム期間
      if (!customStartDate || !customEndDate) return true;
      
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999); // 終了日の終わりまで
      
      return paymentDate >= startDate && paymentDate <= endDate;
    }
    
    return true;
  };

  // フィルタリングされた支払いデータ
  const filteredPayments = payments
    .filter(payment => payment.状態 === '入金済み')
    .filter(filterPaymentsByDate);

  // 合計金額
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + (payment.金額 || 0), 0);

  // 月別の売上データを計算
  const getMonthlyRevenue = () => {
    const monthlyData = {};
    
    filteredPayments.forEach(payment => {
      if (!payment.入金日) return;
      
      const date = new Date(payment.入金日);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[yearMonth]) {
        monthlyData[yearMonth] = {
          count: 0,
          amount: 0
        };
      }
      
      monthlyData[yearMonth].count += 1;
      monthlyData[yearMonth].amount += payment.金額 || 0;
    });
    
    // 日付でソートして返す
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearMonth, data]) => {
        const [year, month] = yearMonth.split('-');
        return {
          label: `${year}年${month}月`,
          count: data.count,
          amount: data.amount
        };
      });
  };
  
  // 項目別の集計
  const getItemSummary = () => {
    const itemData = {};
    
    filteredPayments.forEach(payment => {
      const item = payment.項目 || 'その他';
      
      if (!itemData[item]) {
        itemData[item] = {
          count: 0,
          amount: 0
        };
      }
      
      itemData[item].count += 1;
      itemData[item].amount += payment.金額 || 0;
    });
    
    // 金額の降順でソート
    return Object.entries(itemData)
      .sort(([, a], [, b]) => b.amount - a.amount)
      .map(([item, data]) => ({
        item,
        count: data.count,
        amount: data.amount
      }));
  };
  
  // クライアント別の集計
  const getClientSummary = () => {
    const clientData = {};
    
    filteredPayments.forEach(payment => {
      const clientId = payment.クライアントID;
      const clientName = getClientName(clientId);
      
      if (!clientData[clientId]) {
        clientData[clientId] = {
          name: clientName,
          count: 0,
          amount: 0
        };
      }
      
      clientData[clientId].count += 1;
      clientData[clientId].amount += payment.金額 || 0;
    });
    
    // 金額の降順でソート
    return Object.values(clientData)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // 上位10名のみ
  };
  
  const monthlyRevenue = getMonthlyRevenue();
  const itemSummary = getItemSummary();
  const clientSummary = getClientSummary();

  return (
    <Layout>
      <Head>
        <title>売上レポート | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="page-title">売上レポート</h1>
            <p className="page-description">支払い状況と売上のレポートを表示します</p>
          </div>
          <div className="mt-3 sm:mt-0">
            <Link href="/payments" className="btn btn-outline">
              <span className="material-icons mr-1">arrow_back</span>
              支払い一覧に戻る
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
        <>
          {/* フィルターコントロール */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">期間設定</h2>
            </div>
            
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  className={`px-3 py-2 rounded-md text-sm ${timeRange === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setTimeRange('all')}
                >
                  すべての期間
                </button>
                <button
                  className={`px-3 py-2 rounded-md text-sm ${timeRange === 'year' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setTimeRange('year')}
                >
                  今年
                </button>
                <button
                  className={`px-3 py-2 rounded-md text-sm ${timeRange === 'month' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setTimeRange('month')}
                >
                  今月
                </button>
                <button
                  className={`px-3 py-2 rounded-md text-sm ${timeRange === 'custom' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setTimeRange('custom')}
                >
                  カスタム期間
                </button>
              </div>
              
              {timeRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="form-label">開始日</label>
                    <input
                      type="date"
                      id="startDate"
                      className="form-input"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="form-label">終了日</label>
                    <input
                      type="date"
                      id="endDate"
                      className="form-input"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 概要 */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">売上概要</h2>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary-ultralight p-4 rounded-lg text-center">
                  <h3 className="text-gray-700 text-sm font-medium mb-2">合計売上</h3>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h3 className="text-gray-700 text-sm font-medium mb-2">入金件数</h3>
                  <p className="text-2xl font-bold text-blue-600">{filteredPayments.length}件</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <h3 className="text-gray-700 text-sm font-medium mb-2">平均単価</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredPayments.length > 0 
                      ? Math.round(totalAmount / filteredPayments.length).toLocaleString()
                      : 0}円
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 月別売上 */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">月別売上</h2>
              </div>
              
              {monthlyRevenue.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">件数</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {monthlyRevenue.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                            {item.label}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.count}件
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合計</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {monthlyRevenue.reduce((sum, item) => sum + item.count, 0)}件
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {formatCurrency(monthlyRevenue.reduce((sum, item) => sum + item.amount, 0))}
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  該当する期間のデータがありません
                </div>
              )}
            </div>
            
            {/* 項目別売上 */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">項目別売上</h2>
              </div>
              
              {itemSummary.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">項目</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">件数</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">割合</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {itemSummary.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                            {item.item}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {item.count}件
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                            {totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合計</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {itemSummary.reduce((sum, item) => sum + item.count, 0)}件
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {formatCurrency(itemSummary.reduce((sum, item) => sum + item.amount, 0))}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          100%
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  該当する期間のデータがありません
                </div>
              )}
            </div>
          </div>