import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStatusColor } from '../../lib/clients';
import { CLIENT_STATUS } from '../../lib/constants';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    // クライアント一覧を取得する関数
    async function fetchClients() {
      setIsLoading(true);
      try {
        console.log('クライアントデータ取得開始...');
        
        // フィルタリングパラメータを構築
        const params = new URLSearchParams();
        if (filter.status) params.append('status', filter.status);
        if (filter.search) params.append('search', filter.search);
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        console.log(`API呼び出しURL: /api/clients${queryString}`); // デバッグ用
        
        const response = await fetch(`/api/clients${queryString}`);
        
        console.log('APIレスポンスステータス:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API エラーレスポンス:', errorText);
          throw new Error(`クライアント情報の取得に失敗しました (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`クライアントデータ取得成功: ${data.clients?.length || 0}件`);
        
        setClients(data.clients || []);
        setError(null);
      } catch (err) {
        console.error('クライアント取得エラー:', err);
        setError('クライアント情報の読み込みに失敗しました: ' + err.message);
        setClients([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClients();
  }, [filter]); // フィルター変更時に再取得

  // 検索ハンドラー
  const handleSearch = (e) => {
    setFilter({
      ...filter,
      search: e.target.value
    });
  };

  // ステータスフィルターハンドラー
  const handleStatusFilter = (e) => {
    setFilter({
      ...filter,
      status: e.target.value
    });
  };

  // テスト用のダミーデータ（API接続できない場合に表示）
  const dummyData = [
    { クライアントID: 'C123', お名前: 'テスト太郎', 'お名前　（カナ）': 'テストタロウ', ステータス: CLIENT_STATUS.INQUIRY, メールアドレス: 'test@example.com', 希望セッション形式: 'オンライン' },
    { クライアントID: 'C456', お名前: 'サンプル花子', 'お名前　（カナ）': 'サンプルハナコ', ステータス: CLIENT_STATUS.TRIAL_BEFORE, メールアドレス: 'sample@example.com', 希望セッション形式: '対面' }
  ];

  // エラー時にダミーデータを使用するかどうか
  const useTestData = error && process.env.NODE_ENV === 'development';
  const displayClients = useTestData ? dummyData : clients;

  return (
    <div className="space-y-4">
      {/* フィルターコントロール */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            検索
          </label>
          <input
            type="text"
            id="search"
            value={filter.search}
            onChange={handleSearch}
            placeholder="名前、メールで検索..."
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="w-full md:w-64">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            ステータス
          </label>
          <select
            id="status"
            value={filter.status}
            onChange={handleStatusFilter}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{CLIENT_STATUS.ALL}</option>
            <option value={CLIENT_STATUS.INQUIRY}>{CLIENT_STATUS.INQUIRY}</option>
            <option value={CLIENT_STATUS.TRIAL_BEFORE}>{CLIENT_STATUS.TRIAL_BEFORE}</option>
            <option value={CLIENT_STATUS.TRIAL_AFTER}>{CLIENT_STATUS.TRIAL_AFTER}</option>
            <option value={CLIENT_STATUS.ONGOING}>{CLIENT_STATUS.ONGOING}</option>
            <option value={CLIENT_STATUS.COMPLETED}>{CLIENT_STATUS.COMPLETED}</option>
          </select>
        </div>
        <div className="flex items-end">
          <Link
            href="/clients/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#c50502] hover:bg-[#a00401]"
          >
            新規クライアント
          </Link>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold mb-1">エラーが発生しました</h3>
          <p>{error}</p>
          {useTestData && <p className="mt-2 text-sm">※開発モードのため、テストデータを表示します</p>}
        </div>
      )}

      {/* ローディング表示 */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      ) : (
        <>
          {/* クライアント一覧テーブル */}
          {displayClients.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      クライアント名
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      メールアドレス
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      希望形式
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">詳細</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayClients.map((client) => (
                    <tr key={client.クライアントID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{client.お名前}</div>
                        <div className="text-sm text-gray-500">{client['お名前　（カナ）']}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.メールアドレス}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.ステータス)}`}>
                          {client.ステータス}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.希望セッション形式}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/clients/${client.クライアントID}`} className="text-[#c50502] hover:text-[#a00401]">
                          詳細
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-6 text-center rounded-lg shadow">
              <p className="text-gray-500">該当するクライアントが見つかりません</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}