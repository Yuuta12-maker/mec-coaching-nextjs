import { useState } from 'react';
import SendEmailButton from './SendEmailButton';

/**
 * セッション後フォローアップメールコンポーネント
 * セッション後にクライアントへ次回予約用のカレンダーURLなどを送信する
 * 
 * @param {Object} props
 * @param {Object} props.client - クライアント情報
 * @param {Object} props.sessionData - 現在のセッション情報
 * @param {string} props.calendarUrl - 予約カレンダーURL
 * @param {Function} props.onSend - メール送信後のコールバック（オプション）
 */
export default function SessionFollowUpEmail({ client, sessionData, calendarUrl, onSend }) {
  const [emailContent, setEmailContent] = useState({
    subject: `【次回セッション予約のお願い】マインドエンジニアリング・コーチング`,
    body: getDefaultEmailBody(client, sessionData, calendarUrl)
  });

  // メール本文を編集する
  const handleContentChange = (e) => {
    setEmailContent({
      ...emailContent,
      body: e.target.value
    });
  };

  // 件名を編集する
  const handleSubjectChange = (e) => {
    setEmailContent({
      ...emailContent,
      subject: e.target.value
    });
  };

  // メール送信後の処理
  const handleSend = () => {
    if (onSend) {
      onSend();
    }
  };

  // クライアントのメールアドレスを取得
  const clientEmail = client?.メールアドレス || '';
  const clientName = client?.お名前 || 'クライアント';

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        次回セッション予約のご案内
      </h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          宛先
        </label>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 w-full">
            {clientEmail || '(メールアドレスがありません)'}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          件名
        </label>
        <input
          type="text"
          id="emailSubject"
          value={emailContent.subject}
          onChange={handleSubjectChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          本文
        </label>
        <textarea
          id="emailBody"
          value={emailContent.body}
          onChange={handleContentChange}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white font-mono text-sm"
        />
      </div>

      <div className="flex justify-end">
        <SendEmailButton
          to={clientEmail}
          subject={emailContent.subject}
          body={emailContent.body}
          buttonText="メールを作成"
          buttonClass="btn btn-primary"
          onClick={handleSend}
        />
      </div>
      
      {!clientEmail && (
        <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
          クライアントのメールアドレスが登録されていません。先にクライアント情報を更新してください。
        </div>
      )}
    </div>
  );
}

/**
 * デフォルトのメール本文を生成
 * @param {Object} client - クライアント情報
 * @param {Object} sessionData - セッション情報
 * @param {string} calendarUrl - カレンダーURL
 * @returns {string} - メール本文
 */
function getDefaultEmailBody(client, sessionData, calendarUrl) {
  const clientName = client?.お名前 || 'クライアント';
  const sessionType = sessionData?.セッション種別 || '';
  const nextSessionType = getNextSessionType(sessionType);
  
  return `${clientName}様

本日はマインドエンジニアリング・コーチングのセッションにご参加いただき、ありがとうございました。

次回の${nextSessionType}に向けて、以下のリンクから日時をご選択ください。
カレンダーから、ご都合の良い日時をお選びください。

【予約カレンダー】
${calendarUrl || 'https://calendar.google.com/calendar/appointment...'}

ご不明点などございましたら、お気軽にご連絡ください。
次回のセッションでもお会いできることを楽しみにしております。

--
森山雄太
マインドエンジニアリング・コーチング
TEL: 090-5710-7627
Email: mindengineeringcoaching@gmail.com
`;
}

/**
 * 次回セッションのタイプを取得
 * @param {string} currentType - 現在のセッションタイプ
 * @returns {string} - 次回セッションのタイプ
 */
function getNextSessionType(currentType) {
  if (currentType === 'トライアル') {
    return '継続セッション';
  }
  
  if (currentType && currentType.match(/(\d+)回目/)) {
    const currentNumber = parseInt(RegExp.$1, 10);
    const nextNumber = currentNumber + 1;
    
    if (nextNumber >= 6) {
      return '最終セッション';
    }
    
    return `${nextNumber}回目のセッション`;
  }
  
  return '次回セッション';
}
