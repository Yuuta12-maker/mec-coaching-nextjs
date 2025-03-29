import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { getSheetData, config } from '../lib/sheets';

export default function Dashboard({ weeklySessionsData, clientStatusData, clientsData }) {
  const { data: session } = useSession();
  const [weeklySessions, setWeeklySessions] = useState([]);
  const [clientStatus, setClientStatus] = useState({});
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (weeklySessionsData) {
      setWeeklySessions(weeklySessionsData);
    }
    
    if (clientStatusData) {
      setClientStatus(clientStatusData);
    }
    
    if (clientsData) {
      setClients(clientsData);
    }
    
    setIsLoading(false);
  }, [weeklySessionsData, clientStatusData, clientsData]);
  
  // 今日の日付を取得
  const today = new Date();
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const formattedDate = today.toLocaleDateString('ja-JP', dateOptions);
  
  // 一週間後の日付
  const oneWeekLater = new Date(today);
  oneWeekLater.setDate(today.getDate() + 6); // 今日を含めて7日間
  const formattedEndDate = oneWeekLater.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' });
  
  // ステータスカラーを取得する関数
  const getStatusColor = (status) => {
    switch (status) {
      case '予定':
        return 'bg-blue-100 text-blue-800';
      case '実施済':
        return 'bg-green-100 text-green-800';
      case 'キャンセル':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 日付のフォーマット関数
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);
    
    // 今日の場合は「今日」と表示
    if (sessionDate.getTime() === now.getTime()) {
      return '今日';
    }
    
    // 明日の場合は「明日」と表示
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (sessionDate.getTime() === tomorrow.getTime()) {
      return '明日';
    }
    
    // それ以外は日付を表示
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
  };
  
  // クライアントIDからクライアント情報を取得
  const getClientInfo = (clientId) => {
    return clients.find(client => client.クライアントID === clientId) || {};
  };
  
  return (
    <Layout>
      <Head>
        <title>ダッシュボード | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="page-title">ダッシュボード</h1>
            <p className="page-description">マインドエンジニアリング・コーチング業務管理システム</p>
          </div>
          <div className="mt-3 sm:mt-0">
            <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-md shadow-sm border border-gray-100">
              {formattedDate}
            </div>
          </div>
        </div>
        
        {session && (
          <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md flex items-center border border-green-100">
            <span className="material-icons mr-2 text-green-600">check_circle</span>
            <span>ログイン: {session.user.name || session.user.email}</span>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* クイックアクセスカード */}
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/clients/new" className="card card-interactive flex flex-col items-center justify-center py-8">
                <div className="bg-primary-ultralight rounded-full h-12 w-12 flex items-center justify-center mb-3">
                  <span className="material-icons text-primary">person_add</span>
                </div>
                <h3 className="font-medium text-gray-800">新規クライアント</h3>
              </Link>
              
              <Link href="/sessions/new" className="card card-interactive flex flex-col items-center justify-center py-8">
                <div className="bg-blue-50 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                  <span className="material-icons text-blue-500">add</span>
                </div>
                <h3 className="font-medium text-gray-800">セッション登録</h3>
              </Link>
              
              <Link href="/receipts/create" className="card card-interactive flex flex-col items-center justify-center py-8">
                <div className="bg-red-50 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                  <span className="material-icons text-red-500">receipt</span>
                </div>
                <h3 className="font-medium text-gray-800">領収書作成</h3>
              </Link>
              
              <Link href="/sessions" className="card card-interactive flex flex-col items-center justify-center py-8">
                <div className="bg-green-50 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                  <span className="material-icons text-green-500">calendar_month</span>
                </div>
                <h3 className="font-medium text-gray-800">セッションカレンダー</h3>
              </Link>
            </div>
          </div>
      
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* 今週のセッション */}
            <div className="md:col-span-8">
              <div className="card h-full">
                <div className="card-header">
                  <h2 className="card-title flex items-center">
                    <span className="material-icons mr-2 text-primary">date_range</span>
                    今週のセッション
                  </h2>
                  <Link href="/sessions" className="text-sm text-primary hover:text-primary-dark flex items-center">
                    すべて表示 <span className="material-icons ml-1 text-sm">arrow_forward</span>
                  </Link>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  {formattedDate.split('日')[0]}日 〜 {formattedEndDate}
                </div>
                
                {weeklySessions.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クライアント</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">セッション</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {weeklySessions.map((session, index) => {
                          // クライアント情報を取得
                          const clientInfo = getClientInfo(session.クライアントID);
                          const clientName = clientInfo.お名前 || '不明';
                          const clientInitial = clientName.charAt(0) || '?';
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                                {formatDate(session.予定日時)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                                {new Date(session.予定日時).toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-light text-primary flex items-center justify-center">
                                    <span className="font-medium">
                                      {clientInitial}
                                    </span>
                                  </div>
                                  <div className="ml-3">
                                    {clientName}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                {session.セッション種別}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(session.ステータス)}`}>
                                  {session.ステータス}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                <Link 
                                  href={`/sessions/${session.セッションID || 'unknown'}`}
                                  className="text-primary hover:text-primary-dark font-medium"
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
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <span className="material-icons text-3xl mb-2">event_busy</span>
                    <p>今週のセッションはありません</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* サイドカラム */}
            <div className="md:col-span-4 space-y-6">
              {/* クライアント状況 */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title flex items-center">
                    <span className="material-icons mr-2 text-primary">pie_chart</span>
                    クライアント状況
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(clientStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full ${status === '継続中' ? 'bg-green-500' : status === 'トライアル前' ? 'bg-blue-500' : status === 'トライアル後' ? 'bg-yellow-500' : 'bg-gray-500'} mr-2`}></div>
                        <span className="text-gray-700">{status}</span>
                      </div>
                      <span className="text-xl font-semibold text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href="/clients" className="btn btn-outline w-full">
                    クライアント一覧を見る
                  </Link>
                </div>
              </div>
              
              {/* 最近の支払い */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title flex items-center">
                    <span className="material-icons mr-2 text-primary">payments</span>
                    最近の支払い
                  </h2>
                </div>
                
                <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                  <span className="material-icons text-3xl mb-2">construction</span>
                  <p className="text-center">このセクションは開発中です</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href="/payments" className="btn btn-outline w-full">
                    支払い管理へ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  // getSessionはアプリ全体で管理するので、ここでは条件付きリダイレクトを行わない
  const session = await getSession(context);
  
  try {
    // クライアントデータを取得
    const clients = await getSheetData(config.SHEET_NAMES.CLIENT);
    
    // 今週のセッションデータを取得（今日から一週間分）
    const allSessions = await getSheetData(config.SHEET_NAMES.SESSION);
    
    // 今日の日付（時間はリセット）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 一週間後の日付
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7); // 今日から7日後
    
    // 今週のセッションをフィルタリング（今日以降、一週間後未満）
    const weeklySessions = allSessions.filter(session => {
      if (!session.予定日時) return false;
      
      const sessionDate = new Date(session.予定日時);
      
      // 日付の時間をリセットして比較用に準備
      const sessionDateOnly = new Date(sessionDate);
      sessionDateOnly.setHours(0, 0, 0, 0);
      
      return sessionDateOnly >= today && sessionDateOnly < oneWeekLater;
    });
    
    // 日付順にソート
    weeklySessions.sort((a, b) => {
      return new Date(a.予定日時) - new Date(b.予定日時);
    });
    
    // クライアントのステータス分布を取得
    const statusCount = {};
    
    clients.forEach(client => {
      const status = client.ステータス || '未設定';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return {
      props: {
        weeklySessionsData: weeklySessions,
        clientStatusData: statusCount,
        clientsData: clients,
      },
    };
    
  } catch (error) {
    console.error('データ取得エラー:', error);
    
    return {
      props: {
        weeklySessionsData: [],
        clientStatusData: {},
        clientsData: [],
        error: 'データの取得中にエラーが発生しました。',
      },
    };
  }
}