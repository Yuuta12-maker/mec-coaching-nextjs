import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ClientPayments({ payments, clientId, isLoading }) {
  const router = useRouter();
  const [filter, setFilter] = useState('all'); // 'all', 'paid', 'unpaid'

  // 支払いステータスでフィルタリングする関数
  const filteredPayments = payments?.filter(payment => {
    if (filter === 'all') return true;
    if (filter === 'paid') return payment.状態 === '入金済み';
    if (filter === 'unpaid') return payment.状態 === '未入金';
    return true;
  }) || [];

  // 支払い合計金額を計算
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + (payment.金額 || 0), 0);
  const paidAmount = filteredPayments
    .filter(payment => payment.状態 === '入金済み')
    .reduce((sum, payment) => sum + (payment.金額 || 0), 0);

  // 入金確認処理
  const handleConfirmPayment = async (paymentId) => {
    if (!confirm('この支払いを入金済みにしますか？')) return;

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          支払いID: paymentId,
          入金日: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '入金確認に失敗しました');
      }

      // 成功したらページをリロード
      router.reload();
    } catch (error) {
      console.error('入金確認エラー:', error);
      alert('入金確認に失敗しました: ' + error.message);
    }
  };

  // 請求書生成処理
  const handleGenerateInvoice = async (paymentId) => {
    try {
      // APIエンドポイントへデータを送信
      const response = await fetch('/api/payments/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          支払いID: paymentId
        }),
      });
      
      // レスポンスが正常かチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '請求書の生成に失敗しました');
      }
      
      // PDFとしてレスポンスを取得
      const blob = await response.blob();
      
      // ダウンロードリンクを作成
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `請求書_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // リンクをクリックしてダウンロード
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('請求書生成エラー:', error);
      alert('請求書の生成に失敗しました: ' + error.message);
    }
  };

  // 新規支払い登録ページへ移動
  const handleAddPayment = () => {
    router.push(`/payments/new?clientId=${clientId}`);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">支払いデータを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">支払い履歴</h2>
        <div className="flex flex-col sm:flex-row gap-2">
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
              入金済み
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-md ${filter === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => setFilter('unpaid')}
            >
              未入金
            </button>
          </div>
          <button
            onClick={handleAddPayment}
            className="bg-[#c50502] hover:bg-[#a00401] text-white px-4 py-2 rounded-md text-sm"
          >
            新規支払い登録
          </button>
        </div>
      </div>

      {/* 支払い概要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">支払い件数</h3>
          <p className="text-2xl font-bold">{filteredPayments.length}件</p>
        </div>
        <div className="bg-primary-ultralight p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">支払い総額</h3>
          <p className="text-2xl font-bold">{totalAmount.toLocaleString()}円</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-1">入金済み金額</h3>
          <p className="text-2xl font-bold text-green-700">{paidAmount.toLocaleString()}円</p>
        </div>
      </div>

      {filteredPayments.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                    {payment.項目}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                    {payment.金額?.toLocaleString?.() || 0}円
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${payment.状態 === '入金済み' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {payment.状態 || '未入金'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {payment.登録日 ? new Date(payment.登録日).toLocaleDateString('ja-JP') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {payment.入金日 ? new Date(payment.入金日).toLocaleDateString('ja-JP') : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right space-x-2">
                    <Link 
                      href={`/payments/${payment.支払いID}`} 
                      className="text-primary hover:text-primary-dark"
                    >
                      詳細
                    </Link>
                    {payment.状態 !== '入金済み' && (
                      <button
                        onClick={() => handleConfirmPayment(payment.支払いID)}
                        className="text-green-600 hover:text-green-800 ml-2"
                      >
                        入金確認
                      </button>
                    )}
                    <button
                      onClick={() => handleGenerateInvoice(payment.支払いID)}
                      className="text-blue-600 hover:text-blue-800 ml-2"
                    >
                      請求書
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-gray-500 mb-4">支払い履歴がありません</p>
          <button
            onClick={handleAddPayment}
            className="bg-[#c50502] hover:bg-[#a00401] text-white px-4 py-2 rounded-md text-sm"
          >
            新規支払い登録
          </button>
        </div>
      )}
    </div>
  );
}