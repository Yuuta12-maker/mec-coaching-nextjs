import { useState } from 'react';
import SendEmailButton from './SendEmailButton';

/**
 * セッション確認メール送信コンポーネント
 * @param {Object} props - コンポーネントプロパティ
 * @param {string} props.sessionId - セッションID
 * @param {string} props.clientId - クライアントID
 * @param {Object} props.sessionData - セッションデータ（オプション）
 * @param {Function} props.onSuccess - 成功時のコールバック（オプション）
 */
export default function SessionConfirmationEmail({
  sessionId,
  clientId,
  sessionData,
  onSuccess
}) {
  // セッションの種類を判断
  const isTrialSession = sessionData && sessionData['セッション種別'] === 'トライアル';
  
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">メール送信</h3>
      <p className="text-gray-600 mb-3">
        {isTrialSession 
          ? 'トライアルセッションの確定メールを送信します。' 
          : 'セッション確定のお知らせメールを送信します。'}
      </p>
      
      <SendEmailButton
        apiEndpoint="/api/email/sendSessionConfirmation"
        data={{ sessionId, clientId }}
        buttonText={isTrialSession 
          ? 'トライアル確定メールを送信' 
          : 'セッション確定メールを送信'}
        onSuccess={onSuccess}
      />
    </div>
  );
}
