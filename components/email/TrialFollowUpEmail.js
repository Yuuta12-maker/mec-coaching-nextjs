import { useState } from 'react';
import SendEmailButton from './SendEmailButton';

/**
 * トライアルセッション後のフォローアップメールコンポーネント
 * トライアル後に継続申込みを促すメールを作成・送信する
 * 
 * @param {Object} props
 * @param {Object} props.client - クライアント情報
 * @param {Object} props.sessionData - 現在のセッション情報
 * @param {string} props.formUrl - 申込みフォームのURL
 * @param {Function} props.onSend - メール送信後のコールバック（オプション）
 */
export default function TrialFollowUpEmail({ client, sessionData, formUrl, onSend }) {
  const [emailContent, setEmailContent] = useState({
    subject: `【継続セッションのご案内】マインドエンジニアリング・コーチング`,
    body: getDefaultEmailBody(client, sessionData, formUrl)
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
  
  // 申し込み期限の日付（1週間後）を計算
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 7);
  const deadlineStr = `${deadlineDate.getMonth() + 1}月${deadlineDate.getDate()}日`;

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              このメールはトライアルセッション後の継続申込み案内用です。継続申込みの期限は<strong>{deadlineStr}</strong>までです。
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
 * @param {string} formUrl - 申込みフォームのURL
 * @returns {string} - メール本文
 */
function getDefaultEmailBody(client, sessionData, formUrl) {
  const clientName = client?.お名前 || 'クライアント';
  
  // 申し込み期限の日付（1週間後）を計算
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 7);
  const deadlineStr = `${deadlineDate.getMonth() + 1}月${deadlineDate.getDate()}日`;
  
  // 料金（税込）
  const fee = '214,000円（税込）';
  
  return `${clientName}様

本日はマインドエンジニアリング・コーチングのトライアルセッションにご参加いただき、ありがとうございました。

■ 継続セッションについて
トライアルを通じてお話した通り、真の変化は継続的なコーチングによって実現します。
継続セッション（全5回・6ヶ月間）では、より深いレベルでの変革と成長をサポートします。

・現状の外側にあるゴールの明確化と設定
・ホメオスタシスを活用した自然な変化の促進
・バランスホイールによる人生全体の調和
・新しいコンフォートゾーンの創造と定着

■ セッション料金
${fee}

■ お申込み方法
以下のフォームから${deadlineStr}までにお申し込みください。
${formUrl || 'https://docs.google.com/forms/d/...'}

※トライアルセッション後、1週間以内のお申し込みをお願いしております。

ご質問やご不明点がございましたら、お気軽にご連絡ください。
${clientName}様の可能性が最大限に発揮されるお手伝いができることを楽しみにしております。

--
森山雄太
マインドエンジニアリング・コーチング
TEL: 090-5710-7627
Email: mindengineeringcoaching@gmail.com
`;
}
