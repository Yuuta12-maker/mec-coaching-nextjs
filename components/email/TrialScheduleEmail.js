import { useState } from 'react';
import SendEmailButton from './SendEmailButton';

/**
 * トライアルセッション日程調整メールコンポーネント
 * 問い合わせクライアントへトライアルセッションの日程調整メールを作成・送信する
 * 
 * @param {Object} props
 * @param {Object} props.client - クライアント情報
 * @param {Function} props.onSend - メール送信後のコールバック（オプション）
 * @param {Function} props.onCancel - キャンセル時のコールバック
 */
export default function TrialScheduleEmail({ client, onSend, onCancel }) {
  // 日程候補を生成
  const dateOptions = generateDateOptions(3);
  
  const [emailContent, setEmailContent] = useState({
    subject: `【トライアルセッション日程調整のお知らせ】マインドエンジニアリング・コーチング`,
    body: getDefaultEmailBody(client, dateOptions)
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
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              このメールは初回トライアルセッションの日程調整用です。候補日時は自動的に生成されています。必要に応じて編集してください。
            </p>
          </div>
        </div>
      </div>
      
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
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-800 dark:text-white font-mono text-sm"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
        >
          キャンセル
        </button>
        <SendEmailButton
          to={clientEmail}
          subject={emailContent.subject}
          body={emailContent.body}
          buttonText="メールを作成"
          buttonClass="bg-[#c50502] hover:bg-[#a00401] text-white py-2 px-4 rounded"
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
 * 日程候補を生成する関数
 * @param {number} count - 生成する候補数
 * @returns {string[]} - 日程候補の配列
 */
function generateDateOptions(count = 3) {
  const options = [];
  const now = new Date();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const timeSlots = ['10:00-10:30', '15:00-15:30', '19:00-19:30'];
  
  // 現在の日付から2日後から開始する候補日程
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + 2 + i);
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = dayNames[date.getDay()];
    
    // ランダムな時間枠を選択
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    
    options.push(`${month}月${day}日(${dayOfWeek}) ${timeSlot}`);
  }
  
  return options;
}

/**
 * デフォルトのメール本文を生成
 * @param {Object} client - クライアント情報
 * @param {string[]} dateOptions - 日程候補
 * @returns {string} - メール本文
 */
function getDefaultEmailBody(client, dateOptions) {
  const clientName = client?.お名前 || 'クライアント';
  
  const dateOptionsText = dateOptions.map(date => `・${date}`).join('\n');
  
  return `${clientName}様

マインドエンジニアリング・コーチングへのお問い合わせありがとうございます。

トライアルセッションの日程調整をさせていただきたく、ご連絡いたしました。
以下の候補日時から、ご都合の良い日程をお知らせいただけますと幸いです。

${dateOptionsText}

ご都合の良い日程を、このメールへの返信にてお知らせください。

トライアルセッションは約30分間で、料金は6,000円（税込）となります。
トライアルセッション日程確定後に、お支払い方法と全体の流れについてご案内いたします。

何かご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。

--
森山雄太
マインドエンジニアリング・コーチング
TEL: 090-5710-7627
Email: mindengineeringcoaching@gmail.com
`;
}
