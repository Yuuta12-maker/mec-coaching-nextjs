import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import moment from 'moment';

const ReceiptList = ({ receipts = [], onRefresh }) => {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // 検索フィルタリング
  const filteredReceipts = receipts.filter(receipt => {
    // テキスト検索
    const matchesSearch = searchText ? 
      (receipt.recipientName?.toLowerCase().includes(searchText.toLowerCase()) ||
       receipt.receiptNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
       receipt.description?.toLowerCase().includes(searchText.toLowerCase())) : true;
    
    // 日付範囲
    const matchesDateRange = 
      (dateRange.startDate && dateRange.endDate) ? 
      (moment(receipt.issueDate).isSameOrAfter(dateRange.startDate, 'day') && 
       moment(receipt.issueDate).isSameOrBefore(dateRange.endDate, 'day')) : true;
    
    // 支払い方法フィルター
    const matchesPaymentMethod = 
      selectedFilter === 'all' ? true : 
      receipt.paymentMethod === selectedFilter;
    
    return matchesSearch && matchesDateRange && matchesPaymentMethod;
  });

  // 領収書の編集
  const handleEdit = (receipt) => {
    router.push(`/admin/receipts/edit/${receipt.id}`);
  };

  // 領収書の削除
  const handleDelete = async (receipt) => {
    if (!confirm(`領収書番号：${receipt.receiptNumber}を削除してもよろしいですか？`)) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`/api/receipts/${receipt.id}`);
      setLoading(false);
      alert('領収書を削除しました');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      setLoading(false);
      alert('領収書の削除に失敗しました');
    }
  };

  // 領収書をダウンロード
  const handleDownload = async (receipt) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/receipts/download/${receipt.id}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `領収書_${receipt.receiptNumber}_${receipt.recipientName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setLoading(false);
      alert('領収書をダウンロードしました');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setLoading(false);
      alert('領収書のダウンロードに失敗しました');
    }
  };

  // 領収書をメール送信
  const handleSendEmail = async (receipt) => {
    if (!receipt.email) {
      alert('メールアドレスが設定されていません');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post(`/api/receipts/send-email/${receipt.id}`);
      setLoading(false);
      alert('領収書をメールで送信しました');
    } catch (error) {
      console.error('Error sending email:', error);
      setLoading(false);
      alert('メール送信に失敗しました');
    }
  };

  // 支払い方法表示用の関数
  const getPaymentMethodLabel = (method) => {
    const methods = {
      bankTransfer: '銀行振込',
      cash: '現金',
      creditCard: 'クレジットカード',
      other: 'その他'
    };
    return methods[method] || method;
  };

  // 支払い方法に応じたバッジのスタイルを返す関数
  const getPaymentMethodBadgeClass = (method) => {
    switch (method) {
      case 'bankTransfer':
        return 'bg-blue-100 text-blue-800';
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'creditCard':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="receipt-list">
      {/* ローディングオーバーレイ */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
            <span>処理中...</span>
          </div>
        </div>
      )}

      {/* 検索フィルター */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">検索</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="領収書番号・宛名・内容を検索"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {searchText && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchText('')}
                >
                  <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
              <input
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">支払方法</label>
            <select
              id="paymentMethod"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">すべて</option>
              <option value="bankTransfer">銀行振込</option>
              <option value="cash">現金</option>
              <option value="creditCard">クレジットカード</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>
      </div>

      {/* 領収書一覧テーブル */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {filteredReceipts.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  領収書番号
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  発行日
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  宛名
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  内容
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  支払方法
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{receipt.receiptNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{moment(receipt.issueDate).format('YYYY/MM/DD')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{receipt.recipientName}</div>
                    {receipt.email && (
                      <div className="text-xs text-gray-500">{receipt.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{receipt.amount?.toLocaleString()}円</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs">{receipt.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentMethodBadgeClass(receipt.paymentMethod)}`}>
                      {getPaymentMethodLabel(receipt.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleDownload(receipt)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="ダウンロード"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleSendEmail(receipt)}
                        className={`text-green-600 hover:text-green-900 p-1 ${!receipt.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="メール送信"
                        disabled={!receipt.email}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleEdit(receipt)}
                        className="text-indigo-600 hover:text-indigo-900 p-1"
                        title="編集"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(receipt)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="削除"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-8 text-center text-gray-500">
            {searchText || dateRange.startDate || dateRange.endDate || selectedFilter !== 'all' ? (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg mb-1">検索条件に一致する領収書がありません</p>
                <p className="text-sm">検索条件を変更してください</p>
              </div>
            ) : (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg mb-1">領収書がまだありません</p>
                <p className="text-sm">「新規作成」ボタンから領収書を作成してください</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ページネーション（将来的に必要になれば実装） */}
      {filteredReceipts.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
          <div className="flex-1 flex justify-between">
            <p className="text-sm text-gray-700">
              全 <span className="font-medium">{filteredReceipts.length}</span> 件
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptList;