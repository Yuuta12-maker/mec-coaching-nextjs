import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { formatDate, isToday } from '../../lib/utils';
import { SESSION_STATUS } from '../../lib/constants';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// momentの日本語ローカライズ設定
moment.locale('ja');
const localizer = momentLocalizer(moment);

export default function SessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState('calendar'); // デフォルトをカレンダーに変更
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
        
        // ステータスを正規化
        const normalizedSessions = data.map(session => {
          // 古い表記を新しい表記に変換
          let status = session.ステータス || '';
          
          if (status === '実施済み') status = SESSION_STATUS.COMPLETED;
          
          return {
            ...session,
            ステータス: status
          };
        });
        
        setSessions(normalizedSessions);
        
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
      case SESSION_STATUS.SCHEDULED:
      case '予定':
        return 'bg-blue-100 text-blue-800';
      case SESSION_STATUS.COMPLETED:
      case '実施済み':
      case '実施済':
        return 'bg-green-100 text-green-800';
      case SESSION_STATUS.CANCELED:
      case 'キャンセル':
        return 'bg-red-100 text-red-800';
      case SESSION_STATUS.POSTPONED:
      case '延期':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // セッションステータスに応じたイベントの背景色を取得
  const getEventStyle = (status) => {
    switch (status) {
      case SESSION_STATUS.SCHEDULED:
      case '予定':
        return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' }; // blue
      case SESSION_STATUS.COMPLETED:
      case '実施済み':
      case '実施済':
        return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' }; // green
      case SESSION_STATUS.CANCELED:
      case 'キャンセル':
        return { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }; // red
      case SESSION_STATUS.POSTPONED:
      case '延期':
        return { backgroundColor: '#fef9c3', color: '#854d0e', borderColor: '#fde047' }; // yellow
      default:
        return { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' }; // gray
    }
  };
  
  // セッションデータをカレンダーイベント形式に変換
  const calendarEvents = sessions.map(session => {
    const start = new Date(session.予定日時);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30); // デフォルトで30分のセッション
    
    return {
      id: session.セッションID,
      title: `${formatDate(session.予定日時, 'HH:mm')} ${session.クライアント名 || '不明なクライアント'} (${session.セッション種別 || '未設定'})`,
      start,
      end,
      status: session.ステータス,
      client: session.クライアント名,
      sessionType: session.セッション種別,
      resource: session
    };
  });
  
  // カレンダーのイベントスタイルをカスタマイズ
  const eventStyleGetter = (event) => {
    const style = getEventStyle(event.status);
    return {
      style: {
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderLeft: `4px solid ${style.borderColor}`,
        borderRadius: '4px',
        opacity: 0.9,
        fontWeight: 500,
        paddingLeft: '6px'
      }
    };
  };
  
  // カレンダーのイベントクリック処理
  const handleEventSelect = (event) => {
    router.push(`/sessions/${event.id}`);
  };
  
  // カレンダーの月変更時の処理
  const handleNavigate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    setFilter({ ...filter, month: `${year}-${month}` });
  };
  
  // カレンダーの表示形式変更時の処理
  const handleView = (newView) => {
    // ビュー変更の処理をここに追加できます
    console.log('カレンダービュー変更:', newView);
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
              <option value={SESSION_STATUS.SCHEDULED}>{SESSION_STATUS.SCHEDULED}</option>
              <option value={SESSION_STATUS.COMPLETED}>{SESSION_STATUS.COMPLETED}</option>
              <option value={SESSION_STATUS.CANCELED}>{SESSION_STATUS.CANCELED}</option>
              <option value={SESSION_STATUS.POSTPONED}>{SESSION_STATUS.POSTPONED}</option>
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
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              {filter.month ? formatDate(filter.month + '-01', 'yyyy年MM月') : ''}のセッション
            </h3>
            
            {sessions.length > 0 ? (
              <div className="calendar-container" style={{ height: '700px' }}>
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: '100%' }}
                  views={['month', 'week', 'day', 'agenda']}
                  defaultView="month"
                  defaultDate={filter.month ? new Date(filter.month + '-01') : new Date()}
                  onNavigate={handleNavigate}
                  onView={handleView}
                  onSelectEvent={handleEventSelect}
                  eventPropGetter={eventStyleGetter}
                  messages={{
                    today: '今日',
                    previous: '前へ',
                    next: '次へ',
                    month: '月',
                    week: '週',
                    day: '日',
                    agenda: '一覧',
                    date: '日付',
                    time: '時間',
                    event: 'イベント',
                    noEventsInRange: 'この期間のセッションはありません'
                  }}
                  formats={{
                    monthHeaderFormat: 'YYYY年M月',
                    weekdayFormat: 'dd',
                    dayHeaderFormat: 'M月D日(ddd)',
                    dayRangeHeaderFormat: ({ start, end }) => `${moment(start).format('YYYY年M月D日')} - ${moment(end).format('M月D日')}`,
                    agendaHeaderFormat: ({ start, end }) => `${moment(start).format('YYYY年M月D日')} - ${moment(end).format('M月D日')}`,
                    agendaDateFormat: 'M/D(ddd)',
                    agendaTimeFormat: 'HH:mm',
                    agendaTimeRangeFormat: ({ start, end }) => `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
                  }}
                  dayPropGetter={(date) => {
                    // 今日の日付に特別なスタイルを適用
                    if (isToday(date)) {
                      return {
                        className: 'today-cell',
                        style: {
                          backgroundColor: '#fef2f2',
                        },
                      };
                    }
                    return {};
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                該当するセッションが見つかりません
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* カレンダー用のカスタムCSS */}
      <style jsx global>{`
        /* react-big-calendarのカスタマイズ */
        .rbc-toolbar {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-toolbar button {
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
        }
        
        .rbc-toolbar button:hover,
        .rbc-toolbar button:focus {
          color: #1f2937;
          background-color: #f3f4f6;
          border-color: #9ca3af;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .rbc-toolbar button.rbc-active {
          background-color: #c50502 !important;
          color: white;
          border-color: #a00401;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .rbc-toolbar button.rbc-active:hover {
          background-color: #a00401 !important;
          border-color: #7e0200;
        }
        
        .rbc-header {
          padding: 0.75rem 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
          color: #4b5563;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-header + .rbc-header {
          border-left: 1px solid #e5e7eb;
        }
        
        .rbc-off-range-bg {
          background-color: #f9fafb;
        }
        
        .rbc-date-cell {
          padding: 0.25rem;
          text-align: center;
          font-size: 0.875rem;
          color: #4b5563;
        }
        
        .rbc-date-cell.rbc-now {
          font-weight: 700;
          color: #c50502;
        }
        
        .rbc-event {
          border-radius: 0.25rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          padding: 0.25rem 0.5rem;
          margin-bottom: 0.125rem;
        }
        
        .rbc-day-slot .rbc-event {
          border-radius: 0.25rem;
          margin-right: 0.75rem;
        }
        
        .rbc-day-slot .rbc-event-content {
          font-size: 0.875rem;
        }
        
        .rbc-agenda-view table.rbc-agenda-table {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .rbc-agenda-view table.rbc-agenda-table thead {
          background-color: #f9fafb;
        }
        
        .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          font-size: 0.875rem;
          color: #4b5563;
          text-transform: uppercase;
        }
        
        .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-agenda-view table.rbc-agenda-table tbody > tr:hover {
          background-color: #f9fafb;
        }
        
        .rbc-time-view .rbc-time-header-content .rbc-header {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-time-view .rbc-time-header-content .rbc-allday-cell {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-time-view .rbc-time-content {
          border-top: 1px solid #e5e7eb;
        }
        
        .rbc-time-view .rbc-time-content > * + * > * {
          border-left: 1px solid #e5e7eb;
        }
        
        .rbc-time-view .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        
        /* 今日の日付のスタイル */
        .today-cell {
          background-color: #fef2f2;
          color: #c50502;
        }
      `}</style>
    </Layout>
  );
}