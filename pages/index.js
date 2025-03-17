import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { getSheetData, config } from '../lib/sheets';

export default function Dashboard({ todaySessionsData, clientStatusData }) {
  const { data: session, status } = useSession();
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
  
  if (status === 'loading') {
    return <div className="loading"><div className="spinner"></div></div>;
  }
  
  if (!session) {
    return null; // 認証リダイレクトを処理中
  }
  
  return (
    <Layout>
      <Head>
        <title>ダッシュボード | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <p className="text-gray-600">マインドエンジニアリング・コーチング業務管理システム</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 今日のセッション */}
          <div className="card col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800">今日のセッション</h2>
            </div>
            
            {todaySessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">クライアント</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">セッション</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todaySessions.map((session, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                          {new Date(session.予定日時).toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                          {session.クライアント名}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                          {session.セッション種別}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium 
                            ${session.ステータス === '予定' ? 'bg-blue-100 text-blue-800' : 
                              session.ステータス === '実施済' ? 'bg-green-100 text-green-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {session.ステータス}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                今日のセッションはありません
              </div>
            )}
          </div>
          
          {/* クライアント状況 */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-800 mb-4">クライアント状況</h2>
            <div className="space-y-4">
              {Object.entries(clientStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-gray-600">{status}</span>
                  <span className="text-xl font-medium text-gray-800">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* その他のカード（拡張可能） */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-800 mb-4">最近の支払い</h2>
            <p className="text-gray-500 text-center my-6">このセクションは開発中です</p>
          </div>
          
          <div className="card">
            <h2 className="text-lg font-medium text-gray-800 mb-4">今後のセッション</h2>
            <p className="text-gray-500 text-center my-6">このセクションは開発中です</p>
          </div>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  
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