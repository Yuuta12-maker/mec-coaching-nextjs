import { useState } from 'react';

/**
 * メール送信ボタンコンポーネント
 * @param {Object} props - コンポーネントプロパティ
 * @param {string} props.apiEndpoint - 使用するAPIエンドポイント
 * @param {Object} props.data - 送信するデータ
 * @param {string} props.buttonText - ボタンのテキスト
 * @param {string} props.buttonClass - ボタンのCSSクラス（オプション）
 * @param {string} props.loadingText - 送信中に表示するテキスト（オプション）
 * @param {Function} props.onSuccess - 成功時のコールバック（オプション）
 * @param {Function} props.onError - エラー時のコールバック（オプション）
 */
export default function SendEmailButton({
  apiEndpoint,
  data,
  buttonText,
  buttonClass = 'bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded',
  loadingText = '送信中...',
  onSuccess,
  onError
}) {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSendEmail = async () => {
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'メール送信に失敗しました');
      }

      setResult({
        success: true,
        message: result.message || 'メールを送信しました'
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('メール送信エラー:', error);
      
      setResult({
        success: false,
        message: error.message || 'メール送信に失敗しました'
      });

      if (onError) {
        onError(error);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSendEmail}
        disabled={isSending}
        className={buttonClass}
        type="button"
      >
        {isSending ? loadingText : buttonText}
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
