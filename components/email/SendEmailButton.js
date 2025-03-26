import { useState } from 'react';

/**
 * メール送信ボタンコンポーネント
 * Gmail（または標準メールクライアント）にテンプレート文章が記入された状態で表示します
 * 
 * @param {Object} props - コンポーネントプロパティ
 * @param {string} props.to - 宛先メールアドレス
 * @param {string} props.subject - 件名
 * @param {string} props.body - メール本文
 * @param {string} props.buttonText - ボタンのテキスト
 * @param {string} props.buttonClass - ボタンのCSSクラス（オプション）
 * @param {Function} props.onClick - クリック時のコールバック（オプション）
 */
export default function SendEmailButton({
  to,
  subject,
  body,
  buttonText = 'メールを送信',
  buttonClass = 'bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded',
  onClick
}) {
  const [result, setResult] = useState(null);

  const handleSendEmail = () => {
    try {
      // subject と body をエンコード
      const encodedSubject = encodeURIComponent(subject || '');
      const encodedBody = encodeURIComponent(body || '');
      
      // mailto: URLを生成
      const mailtoUrl = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
      
      // 新しいウィンドウでmailtoリンクを開く
      window.open(mailtoUrl, '_blank');
      
      setResult({
        success: true,
        message: 'メールクライアントを開きました'
      });
      
      // コールバック実行
      if (onClick) {
        onClick();
      }
    } catch (error) {
      console.error('メールクライアント起動エラー:', error);
      
      setResult({
        success: false,
        message: error.message || 'メールクライアントの起動に失敗しました'
      });
    }
  };

  return (
    <div>
      <button
        onClick={handleSendEmail}
        className={buttonClass}
        type="button"
      >
        {buttonText}
      </button>
      
      {result && (
        <div 
          className={`mt-2 p-2 rounded text-sm ${
            result.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
