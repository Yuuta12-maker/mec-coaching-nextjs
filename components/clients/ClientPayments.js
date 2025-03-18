import { useState } from 'react';
import Link from 'next/link';
import { formatDate, formatCurrency } from '../../lib/utils';

// クライアントの支払い履歴表示コンポーネント
export default function ClientPayments({ payments, clientId, isLoading }) {
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'unpaid'

  // 支払い合計を計算
  const totalAmount = payments.reduce((sum, payment) => {
    return sum + (parseInt(payment.金額, 10) || 0);
  }, 0);
  
  // 支払い済み/未払い合計を計算
  const paidAmount = payments
    .filter(payment => payment.状態 === '入金済み')
    .reduce((sum, payment) => {
      return sum + (parseInt(payment.金額, 10) || 0);
    }, 0);
  
  const unpaidAmount = totalAmount - paidAmount;
  
  // 支払い件数
  const paidCount = payments.filter(payment => payment.状態 === '入金済み').length;
  const unpaidCount = payments.filter(payment => payment.状態 === '未入金').length;

  // 支払いデータがない場合
  if (!payments || payments.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">支払い履歴がありません</p>
        <Link
          href={`/payments/new?clientId=${clientId}`}
          className="mt-4 inline-block px-4 py-2 bg-[#c50502] hover:bg-[#a00401] text-white rounded-md text-sm font-medium"
        >
          新規支払いを登録
        </Link>
      </div>
    );
  }

  // フィルター適用
  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    if (filter === 'paid') return payment.状態 === '入金済み';
    if (filter === 'unpaid') return payment.状態 === '未入金';
    return true;
  });
  
  // 日付でソート（新しい順）
  filteredPayments.sort((a, b) => {
    return new Date(b.登録日 || 0) - new Date(a.登録日 || 0);
  });

  return (
    <div className="p-6">
      {/* 支払い概要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* 合計 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">支払い合計</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          <p className="text-sm text-gray-500">全{payments.length}件</p>
        </div>
        
        {/* 支払い済み */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">支払い済み</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
          <p className="text-sm text-gray-500">{paidCount}件</p>
        </div>
        
        {/* 未払い */}
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">未払い</h3>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(unpaidAmount)}</p>
          <p className="text-sm text-gray-500">{unpaidCount}件</p>
        </div>
      </div>

      {/* フィルターとボタン */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <label htmlFor="payment-filter" className="sr-only">
            支払いフィルター
          </label>
          <select
            id="payment-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-[#c50502] focus:outline-none focus:ring-[#c50502]"
          >
            <option value="all">すべての支払い</option>
            <option value="paid">支払い済み</option>
            <option value="unpaid">未払い</option>
          </select>
        </div>
        
        <Link
          href={`/payments/new?clientId=${clientId}`}
          className="px-4 py-2 bg-[#c50502] hover:bg-[#a00401] text-white rounded-md text-sm font-medium"
        >
          新規支払いを登録
        </Link>
      </div>

      {/* 支払い一覧 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                登録日
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                項目
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                金額
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                状態
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                入金日
              </th>
              <th
                scope="col"
                className="relative px-6 py-3"
              >
                <span className="sr-only">詳細</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.map((payment, index) => (
              <tr
                key={payment.支払いID || index}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(payment.登録日, 'yyyy/MM/dd')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{payment.項目 || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(payment.金額)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${payment.状態 === '入金済み' ? 'bg-green-100 text-green-800' : 
                        payment.状態 === '未入金' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}
                  >
                    {payment.状態 || '未設定'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payment.入金日 ? formatDate(payment.入金日, 'yyyy/MM/dd') : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/payments/${payment.支払いID}`}
                    className="text-[#c50502] hover:underline"
                  >
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 支払いが0件の場合 */}
      {filteredPayments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">条件に一致する支払いがありません</p>
        </div>
      )}
    </div>
  );
}