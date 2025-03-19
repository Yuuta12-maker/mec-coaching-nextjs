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
  const [viewMode, setViewMode] = useState('table'); // 'table' または 'card'

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
        
        // ステータスの正規化
        const normalizedClients = data.clients?.map(client => {
          // 古い表記を新しい表記に変換
          let status = client.ステータス || '';
          
          if (status === '問合せ') status = CLIENT_STATUS.INQUIRY;
          else if (status === 'トライアル予約済') status = CLIENT_STATUS.TRIAL_BEFORE;
          else if (status === '継続中') status = CLIENT_STATUS.ONGOING;
          
          return {
            ...client,
            ステータス: status
          };
        }) || [];
        
        setClients(normalizedClients);
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

  // 表示モード切り替えハンドラー
  const toggleViewMode = () => {
    setViewMode(viewMode === 'table' ? 'card' : 'table');
  };

  // テスト用のダミーデータ（API接続できない場合に表示）
  const dummyData = [
    { クライアントID: 'C123', お名前: 'テスト太郎', 'お名前　（カナ）': 'テストタロウ', ステータス: CLIENT_STATUS.INQUIRY, メールアドレス: 'test@example.com', 希望セッション形式: 'オンライン' },
    { クライアントID: 'C456', お名前: 'サンプル花子', 'お名前　（カナ）': 'サンプルハナコ', ステータス: CLIENT_STATUS.TRIAL_BEFORE, メールアドレス: 'sample@example.com', 希望セッション形式: '対面' }
  ];

  // エラー時にダミーデータを使用するかどうか
  const useTestData = error && process.env.NODE_ENV === 'development';
  const displayClients = useTestData ? dummyData : clients;

  // クライアントカードの表示
  const renderClientCard = (client) => (
    <div key={client.クライアントID} className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{client.お名前}</h3>
          <p className="text-sm text-gray-500">{client['お名前　（カナ）']}</p>
        </div>
        <span className={`status-indicator self-start ${getStatusColor(client.ステータス).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
          {client.ステータス}
        </span>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm">
          <span className="material-icons text-gray-400 mr-2 text-lg">email</span>
          <span className="text-gray-600">{client.メールアドレス}</span>
        </div>
        
        <div className="flex items-center text-sm">
          <span className="material-icons text-gray-400 mr-2 text-lg">videocam</span>
          <span className="text-gray-600">{client.希望セッション形式 || '未指定'}</span>
        </div>
        
        {client.電話番号 && (
          <div className="flex items-center text-sm">
            <span className="material-icons text-gray-400 mr-2 text-lg">phone</span>
            <span className="text-gray-600">{client.電話番号}</span>
          </div>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
        <Link 
          href={`/clients/${client.クライアントID}`} 
          className="btn btn-primary"
        >
          詳細を見る
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* フィルターコントロール */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="form-label">
              <span className="flex items-center">
                <span className="material-icons mr-1 text-gray-500 text-lg">search</span>
                検索
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={filter.search}
                onChange={handleSearch}
                placeholder="名前、メールで検索..."
                className="form-input pl-10"
              />
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <span className="material-icons text-lg">search</span>
              </span>
            </div>
          </div>
          
          <div className="w-full md:w-64">
            <label htmlFor="status" className="form-label">
              <span className="flex items-center">
                <span className="material-icons mr-1 text-gray-500 text-lg">filter_list</span>
                ステータス
              </span>
            </label>
            <select
              id="status"
              value={filter.status}
              onChange={handleStatusFilter}
              className="form-input"
            >
              <option value="">{CLIENT_STATUS.ALL}</option>
              <option value={CLIENT_STATUS.INQUIRY}>{CLIENT_STATUS.INQUIRY}</option>
              <option value={CLIENT_STATUS.TRIAL_BEFORE}>{CLIENT_STATUS.TRIAL_BEFORE}</option>
              <option value={CLIENT_STATUS.TRIAL_AFTER}>{CLIENT_STATUS.TRIAL_AFTER}</option>
              <option value={CLIENT_STATUS.ONGOING}>{CLIENT_STATUS.ONGOING}</option>
              <option value={CLIENT_STATUS.COMPLETED}>{CLIENT_STATUS.COMPLETED}</option>
              <option value={CLIENT_STATUS.SUSPENDED}>{CLIENT_STATUS.SUSPENDED}</option>
            </select>
          </div>
          
          <div className="flex items-end space-x-3">
            {/* 表示モード切り替えボタン */}
            <button
              onClick={toggleViewMode}
              className="btn btn-outline flex items-center px-3"
              aria-label={viewMode === 'table' ? 'カード表示に切り替え' : 'テーブル表示に切り替え'}
            >
              <span className="material-icons mr-1">
                {viewMode === 'table' ? 'grid_view' : 'view_list'}
              </span>
              <span className="hidden sm:inline">
                {viewMode === 'table' ? 'カード表示' : 'リスト表示'}
              </span>
            </button>
            
            <Link
              href="/clients/new"
              className="btn btn-primary flex items-center"
            >
              <span className="material-icons mr-1">person_add</span>
              <span className="hidden sm:inline">新規クライアント</span>
            </Link>
          </div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="material-icons text-red-500">error</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              {useTestData && <p className="mt-2 text-xs text-red-600">※開発モードのため、テストデータを表示します</p>}
            </div>
          </div>
        </div>
      )}

      {/* ローディング表示 */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">クライアントデータを読み込み中...</p>
        </div>
      ) : (
        <>
          {displayClients.length > 0 ? (
            viewMode === 'table' ? (
              // テーブル表示
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left">
                        クライアント名
                      </th>
                      <th scope="col" className="px-6 py-3 text-left">
                        メールアドレス
                      </th>
                      <th scope="col" className="px-6 py-3 text-left">
                        ステータス
                      </th>
                      <th scope="col" className="px-6 py-3 text-left">
                        希望形式
                      </th>
                      <th scope="col" className="px-6 py-3 text-right">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayClients.map((client) => (
                      <tr key={client.クライアントID} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-light text-primary flex items-center justify-center">
                              <span className="font-medium">
                                {client.お名前?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{client.お名前}</div>
                              <div className="text-sm text-gray-500">{client['お名前　（カナ）']}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{client.メールアドレス}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`status-indicator ${getStatusColor(client.ステータス)}`}>
                            {client.ステータス}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <span className="material-icons mr-1 text-gray-400 text-lg">
                              {client.希望セッション形式 === 'オンライン' ? 'videocam' : 'person'}
                            </span>
                            {client.希望セッション形式}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link 
                            href={`/clients/${client.クライアントID}`} 
                            className="text-primary hover:text-primary-dark font-medium"
                          >
                            詳細
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // カード表示
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayClients.map(client => renderClientCard(client))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow">
              <span className="material-icons text-gray-400 text-5xl mb-4">search_off</span>
              <h3 className="text-lg font-medium text-gray-900 mb-1">該当するクライアントが見つかりません</h3>
              <p className="text-gray-500">検索条件を変更するか、新しくクライアントを登録してください</p>
              <Link href="/clients/new" className="btn btn-primary mt-4">
                新規クライアント登録
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}