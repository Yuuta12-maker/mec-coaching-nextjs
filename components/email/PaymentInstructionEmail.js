import { useState } from 'react';
import SendEmailButton from './SendEmailButton';

/**
 * 支払い案内メールコンポーネント
 * クライアントへトライアルセッションの支払い方法を案内するメールを作成・送信する
 * 
 * @param {Object} props
 * @param {Object} props.client - クライアント情報
 * @param {Function} props.onSend - メール送信後のコールバック（オプション）
 * @param {Function} props.onCancel - キャンセル時のコールバック
 */
export default function PaymentInstructionEmail({ client, onSend, onCancel }) {
  const [emailContent, setEmailContent] = useState({
    subject: `【お支払いのご案内】マインドエンジニアリング・コーチング`,
    body: getDefaultEmailBody(client)
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
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              このメールはトライアルセッションのお支払い案内用です。必要に応じて内容を編集してください。
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
 * デフォルトのメール本文を生成
 * @param {Object} client - クライアント情報
 * @returns {string} - メール本文
 */
function getDefaultEmailBody(client) {
  const clientName = client?.お名前 || 'クライアント';
  
  // セッション日の3日前を期限として設定
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 3); // 仮の期日（実際はセッション日に応じて変更）
  const deadlineStr = `${deadlineDate.getMonth() + 1}月${deadlineDate.getDate()}日`;
  
  return `${clientName}様

マインドエンジニアリング・コーチングへのお問い合わせありがとうございます。

トライアルセッションのお支払い方法についてご案内いたします。

【お支払い情報】
・項目: トライアルセッション料金
・金額: 6,000円（税込）
・振込先:
  ・店名: 六一八（ろくいちはち）
  ・店番: 618
  ・普通預金
  ・口座番号: 1396031
  ・口座名義: モリヤマユウタ
・支払い期日: ${deadlineStr}

お支払いが確認できましたら、改めてセッション詳細をお送りいたします。

また、トライアルセッション後に継続をご希望される場合は、1週間以内にお知らせください。
継続セッション（2～6回目）の料金は214,000円（税込）となります。

何かご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。

--
森山雄太
マインドエンジニアリング・コーチング
TEL: 090-5710-7627
Email: mindengineeringcoaching@gmail.com
`;
}
