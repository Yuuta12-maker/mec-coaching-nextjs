import { useState } from 'react';
import Link from 'next/link';
import { formatDate, isToday } from '../../lib/utils';

// クライアントのセッション履歴表示コンポーネント
export default function ClientSessions({ sessions, clientId, isLoading }) {
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  
  // セッションデータがない場合
  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">セッション履歴がありません</p>
        <Link
          href={`/sessions/new?clientId=${clientId}`}
          className="mt-4 inline-block px-4 py-2 bg-[#c50502] hover:bg-[#a00401] text-white rounded-md text-sm font-medium"
        >
          新規セッションを登録
        </Link>
      </div>
    );
  }

  // フィルター適用
  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    
    const sessionDate = new Date(session.予定日時);
    const now = new Date();
    
    if (filter === 'upcoming') {
      return sessionDate >= now;
    } else if (filter === 'past') {
      return sessionDate < now;
    }
    
    return true;
  });
  
  // 日付でソート（過去/未来を判断して適切なソート順にする）
  filteredSessions.sort((a, b) => {
    const dateA = new Date(a.予定日時);
    const dateB = new Date(b.予定日時);
    
    if (filter === 'upcoming') {
      // 未来のセッションは古い日付から表示（昇順）
      return dateA - dateB;
    } else {
      // 過去のセッションは新しい日付から表示（降順）
      return dateB - dateA;
    }
  });

  return (
    <div className="p-6">
      {/* フィルターとボタン */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <label htmlFor="session-filter" className="sr-only">
            セッションフィルター
          </label>
          <select
            id="session-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-[#c50502] focus:outline-none focus:ring-[#c50502]"
          >
            <option value="all">すべてのセッション</option>
            <option value="upcoming">予定されたセッション</option>
            <option value="past">過去のセッション</option>
          </select>
        </div>
        
        <Link
          href={`/sessions/new?clientId=${clientId}`}
          className="px-4 py-2 bg-[#c50502] hover:bg-[#a00401] text-white rounded-md text-sm font-medium"
        >
          新規セッションを登録
        </Link>
      </div>

      {/* セッション一覧 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                日時
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                セッション種別
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ステータス
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Google Meet URL
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
            {filteredSessions.map((session, index) => {
              const sessionDate = new Date(session.予定日時);
              const isPast = sessionDate < new Date();
              const isForToday = isToday(sessionDate);
              
              return (
                <tr
                  key={session.セッションID || index}
                  className={`hover:bg-gray-50 ${isForToday ? 'bg-green-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${isForToday ? 'font-bold' : ''}`}>
                      {formatDate(session.予定日時, 'yyyy/MM/dd')}
                      {isForToday && <span className="ml-2 text-green-600">（今日）</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(session.予定日時, 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{session.セッション種別 || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${session.ステータス === '予定' ? 'bg-blue-100 text-blue-800' : 
                          session.ステータス === '実施済' ? 'bg-green-100 text-green-800' : 
                            session.ステータス === 'キャンセル' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}
                    >
                      {session.ステータス || '未設定'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {session['Google Meet URL'] ? (
                      <a
                        href={session['Google Meet URL']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c50502] hover:underline text-sm"
                      >
                        参加リンク
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">なし</span>
                    )}
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

      {/* セッションが0件の場合 */}
      {filteredSessions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">条件に一致するセッションがありません</p>
        </div>
      )}
    </div>
  );
}