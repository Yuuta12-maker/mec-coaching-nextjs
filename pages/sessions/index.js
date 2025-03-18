import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { formatDate, isToday } from '../../lib/utils';

export default function SessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    status: '',
    month: new Date().toISOString().slice(0, 7) // 現在の年月（YYYY-MM形式）
  });
  
  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/sessions');
    }
  }, [status, router]);

  // セッション一覧を取得
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        setError(null);
        
        // フィルタリングパラメータの構築
        const params = new URLSearchParams();
        if (filter.status) {
          params.append('status', filter.status);
        }
        
        // 月指定がある場合は範囲指定
        if (filter.month) {
          const [year, month] = filter.month.split('-');
          const startDate = `${filter.month}-01T00:00:00`;
          
          // 月の最終日を計算
          const lastDay = new Date(year, month, 0).getDate();
          const endDate = `${filter.month}-${lastDay}T23:59:59`;
          
          params.append('from', startDate);
          params.append('to', endDate);
        }
        
        // APIリクエスト
        console.log('セッション一覧を取得します...');
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`/api/sessions${queryString}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('APIエラーレスポンス:', errorData);
          throw new Error(errorData.error || errorData.details || 'セッション一覧の取得に失敗しました');
        }
        
        const data = await response.json();
        console.log(`セッションデータ取得成功: ${data.length}件`);
        setSessions(data);
        
      } catch (err) {
        console.error('セッション一覧取得エラー:', err);
        setError(err.message || 'データの取得中にエラーが発生しました');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSessions();
  }, [filter]);

  // ステータスフィルター変更時の処理
  const handleStatusChange = (e) => {
    setFilter({ ...filter, status: e.target.value });
  };
  
  // 月フィルター変更時の処理
  const handleMonthChange = (e) => {
    setFilter({ ...filter, month: e.target.value });
  };
  
  // 現在の月を取得
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // セッションステータスに応じた色分け
  const getStatusColor = (status) => {
    switch (status) {
      case '予定':
        return 'bg-blue-100 text-blue-800';
      case '実施済み':
        return 'bg-green-100 text-green-800';
      case 'キャンセル':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ローディング表示
  if (loading && sessions.length === 0) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>セッション一覧 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">セッション一覧</h1>
          <p className="text-gray-600">予定されたセッションを管理します</p>
        </div>
        <div className="mt-2 md:mt-0">
          <Link
            href="/sessions/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#c50502] hover:bg-[#a00401]"
          >
            新規セッション
          </Link>
        </div>
      </div>
      
      {/* フィルターコントロール */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="view-mode" className="text-sm font-medium text-gray-700">
            表示:
          </label>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none ${
                viewMode === 'list'
                  ? 'bg-[#c50502] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              リスト
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none ${
                viewMode === 'calendar'
                  ? 'bg-[#c50502] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              カレンダー
            </button>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-1">
              月を選択
            </label>
            <input
              id="month-filter"
              type="month"
              value={filter.month}
              onChange={handleMonthChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
            />
          </div>
          
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              id="status-filter"
              value={filter.status}
              onChange={handleStatusChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
            >
              <option value="">すべて</option>
              <option value="予定">予定</option>
              <option value="実施済み">実施済み</option>
              <option value="キャンセル">キャンセル</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold">エラーが発生しました</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-[#c50502] hover:underline"
          >
            ページを再読み込み
          </button>
        </div>
      )}
      
      {/* セッション一覧（リスト表示） */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日時
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      クライアント
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      セッション種別
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">詳細</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => {
                    const sessionDate = new Date(session.予定日時);
                    const isSessionToday = isToday(sessionDate);
                    
                    return (
                      <tr 
                        key={session.セッションID} 
                        className={`hover:bg-gray-50 ${isSessionToday ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(session.予定日時, 'yyyy/MM/dd')}
                            {isSessionToday && <span className="ml-2 text-green-600">（今日）</span>}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(session.予定日時, 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {session.クライアント名 || '不明'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {session.セッション種別 || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.ステータス)}`}>
                            {session.ステータス || '未設定'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/sessions/${session.セッションID}`}
                            className="text-[#c50502] hover:underline"
                          >
                            詳細
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              該当するセッションが見つかりません
            </div>
          )}
        </div>
      )}
      
      {/* セッション一覧（カレンダー表示） */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {filter.month ? formatDate(filter.month + '-01', 'yyyy年MM月') : ''}のセッション
            </h3>
            
            {sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => {
                  const sessionDate = new Date(session.予定日時);
                  const isSessionToday = isToday(sessionDate);
                  
                  return (
                    <Link
                      key={session.セッションID}
                      href={`/sessions/${session.セッションID}`}
                      className={`block p-4 border rounded-lg hover:shadow-md transition ${
                        isSessionToday ? 'border-green-300 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-500">
                            {formatDate(session.予定日時, 'yyyy/MM/dd')}
                            {isSessionToday && <span className="ml-1 text-green-600">（今日）</span>}
                          </p>
                          <p className="font-medium text-gray-900">
                            {formatDate(session.予定日時, 'HH:mm')} - {session.セッション種別 || '種別未設定'}
                          </p>
                          <p className="mt-1">{session.クライアント名 || '不明なクライアント'}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.ステータス)}`}>
                          {session.ステータス || '未設定'}
                        </span>
                      </div>
                      
                      {session['Google Meet URL'] && (
                        <div className="mt-2 text-sm text-[#c50502]">
                          Google Meetリンクあり
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                該当するセッションが見つかりません
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}