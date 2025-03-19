import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { getSheetData, config } from '../lib/sheets';

export default function Dashboard({ todaySessionsData, clientStatusData }) {
  const { data: session } = useSession();
  const [todaySessions, setTodaySessions] = useState([]);
  const [clientStatus, setClientStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (todaySessionsData) {
      setTodaySessions(todaySessionsData);
    }
    
    if (clientStatusData) {
      setClientStatus(clientStatusData);
    }
    
    setIsLoading(false);
  }, [todaySessionsData, clientStatusData]);
  
  // 今日の日付を取得
  const today = new Date();
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const formattedDate = today.toLocaleDateString('ja-JP', dateOptions);
  
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
                  <span className="material-icons text-blue-500">calendar_add_on</span>
                </div>
                <h3 className="font-medium text-gray-800">セッション登録</h3>
              </Link>
              
              <Link href="/clients" className="card card-interactive flex flex-col items-center justify-center py-8">
                <div className="bg-purple-50 rounded-full h-12 w-12 flex items-center justify-center mb-3">
                  <span className="material-icons text-purple-500">groups</span>
                </div>
                <h3 className="font-medium text-gray-800">クライアント一覧</h3>
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
            {/* 今日のセッション */}
            <div className="md:col-span-8">
              <div className="card h-full">
                <div className="card-header">
                  <h2 className="card-title flex items-center">
                    <span className="material-icons mr-2 text-primary">today</span>
                    今日のセッション
                  </h2>
                  <Link href="/sessions" className="text-sm text-primary hover:text-primary-dark flex items-center">
                    すべて表示 <span className="material-icons ml-1 text-sm">arrow_forward</span>
                  </Link>
                </div>
                
                {todaySessions.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クライアント</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">セッション</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {todaySessions.map((session, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                              {new Date(session.予定日時).toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-light text-primary flex items-center justify-center">
                                  <span className="font-medium">
                                    {session.クライアント名?.charAt(0) || '?'}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  {session.クライアント名}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <span className="material-icons text-3xl mb-2">event_busy</span>
                    <p>今日のセッションはありません</p>
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
    // 今日のセッションデータを取得
    const allSessions = await getSheetData(config.SHEET_NAMES.SESSION);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysessions = allSessions.filter(session => {
      if (!session.予定日時) return false;
      
      const sessionDate = new Date(session.予定日時);
      sessionDate.setHours(0, 0, 0, 0);
      
      return sessionDate.getTime() === today.getTime();
    });
    
    // クライアントのステータス分布を取得
    const clients = await getSheetData(config.SHEET_NAMES.CLIENT);
    const statusCount = {};
    
    clients.forEach(client => {
      const status = client.ステータス || '未設定';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    
    return {
      props: {
        todaySessionsData: todaysessions,
        clientStatusData: statusCount,
      },
    };
    
  } catch (error) {
    console.error('データ取得エラー:', error);
    
    return {
      props: {
        todaySessionsData: [],
        clientStatusData: {},
        error: 'データの取得中にエラーが発生しました。',
      },
    };
  }
}