import { formatDate } from '../../lib/utils';
import { SessionFollowUpEmail, TrialFollowUpEmail } from '../email';


// セッション詳細情報表示コンポーネント
export default function SessionDetail({ sessionData, clientData }) {
  if (!sessionData) {
    return (
      <div className="p-6 text-center text-gray-500">
        セッション情報を読み込めませんでした
      </div>
    );
  }

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

  // GoogleMeetリンクの表示ロジック
  const renderMeetLink = () => {
    if (!sessionData['Google Meet URL']) {
      return <p className="text-gray-500">GoogleMeetリンクがありません</p>;
    }

    return (
      <a
        href={sessionData['Google Meet URL']}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-[#c50502] hover:underline"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        ミーティングに参加
      </a>
    );
  };

  // セッション日が近い場合のバッジ表示
  const getDateStatus = () => {
    if (!sessionData.予定日時) return null;
    
    const sessionDate = new Date(sessionData.予定日時);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sessionDay = new Date(sessionDate);
    sessionDay.setHours(0, 0, 0, 0);
    
    if (sessionDay.getTime() === today.getTime()) {
      return <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">今日</span>;
    } else if (sessionDay.getTime() === tomorrow.getTime()) {
      return <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">明日</span>;
    } else if (sessionDay < today) {
      return <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">過去</span>;
    }
    
    return null;
  };

  return (
    <div className="p-6">
      {/* ステータスバッジ */}
      <div className="mb-6 flex items-center">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            sessionData.ステータス || '未設定'
          )}`}
        >
          {sessionData.ステータス || '未設定'}
        </span>
        {getDateStatus()}
      </div>

      {/* セッション情報とクライアント情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* セッション情報 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">セッション情報</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">セッション種別</h4>
              <p className="text-gray-900">{sessionData.セッション種別 || '未設定'}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">予定日時</h4>
              <p className="text-gray-900">
                {sessionData.予定日時 
                  ? formatDate(sessionData.予定日時, 'yyyy年MM月dd日 HH:mm') 
                  : '未設定'}
              </p>
            </div>
            
            {sessionData.ステータス === '実施済み' && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">実施日時</h4>
                <p className="text-gray-900">
                  {sessionData.実施日時 
                    ? formatDate(sessionData.実施日時, 'yyyy年MM月dd日 HH:mm') 
                    : '記録なし'}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">GoogleMeet URL</h4>
              <div>{renderMeetLink()}</div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">登録日時</h4>
              <p className="text-gray-500 text-sm">
                {sessionData.登録日時 
                  ? formatDate(sessionData.登録日時, 'yyyy/MM/dd HH:mm') 
                  : '未記録'}
              </p>
            </div>
            
            {sessionData.更新日時 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">最終更新</h4>
                <p className="text-gray-500 text-sm">
                  {formatDate(sessionData.更新日時, 'yyyy/MM/dd HH:mm')}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* クライアント情報 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">クライアント情報</h3>
          
          {clientData ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">氏名</h4>
                <p className="text-gray-900 font-medium">{clientData.お名前 || '未設定'}</p>
                <p className="text-gray-500 text-sm">{clientData['お名前　（カナ）'] || ''}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">メールアドレス</h4>
                <p className="text-gray-900">
                  <a
                    href={`mailto:${clientData.メールアドレス}`}
                    className="text-[#c50502] hover:underline"
                  >
                    {clientData.メールアドレス || '未設定'}
                  </a>
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">電話番号</h4>
                <p className="text-gray-900">
                  {clientData['電話番号　（ハイフンなし）'] ? (
                    <a
                      href={`tel:${clientData['電話番号　（ハイフンなし）']}`}
                      className="text-[#c50502] hover:underline"
                    >
                      {clientData['電話番号　（ハイフンなし）'].replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
                    </a>
                  ) : (
                    '未設定'
                  )}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">希望セッション形式</h4>
                <p className="text-gray-900">{clientData.希望セッション形式 || '未設定'}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">ステータス</h4>
                <p className="text-gray-900">{clientData.ステータス || '未設定'}</p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              クライアント情報が見つかりません
            </div>
          )}
        </div>
      </div>

      {/* セッションノート/メモ（あれば表示） */}
      {sessionData.メモ && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">セッションノート</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{sessionData.メモ}</p>
          </div>
        </div>
      )}

      {/* メール送信セクション */}
      {sessionData && clientData && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-2">メール送信</h3>
          
          {/* トライアルセッションの場合は継続案内メールを表示 */}
          {sessionData.セッション種別 === 'トライアル' && sessionData.ステータス === '実施済み' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-light text-primary mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </span>
                <h4 className="font-medium text-gray-800">トライアル後継続案内</h4>
              </div>
              <TrialFollowUpEmail
                client={clientData}
                sessionData={sessionData}
                formUrl="https://docs.google.com/forms/d/1HNEkQx3ug5l9aPD3xnVVSpm0NIrhW1vHBT21iMYOlBU/edit"
                onSend={() => {
                  console.log('メール作成しました');
                }}
              />
            </div>
          )}
          
          {/* 通常セッションの場合は次回予約案内メールを表示 */}
          {(sessionData.セッション種別 !== 'トライアル' || sessionData.ステータス !== '実施済み') && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-light text-primary mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </span>
                <h4 className="font-medium text-gray-800">次回セッション予約のご案内</h4>
              </div>
              <SessionFollowUpEmail
                client={clientData}
                sessionData={sessionData}
                calendarUrl="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0ZzWoMRPfGQfS0SMQNDVJMbEZyuT-lLDwFRNwvSjLFn7OG7hBBYKgfHKy3QNqQXzlb8AOnL1Uw"
                onSend={() => {
                  console.log('メール作成しました');
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}