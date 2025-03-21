import SendEmailButton from './SendEmailButton';

/**
 * 支払い確認メール送信コンポーネント
 * @param {Object} props - コンポーネントプロパティ
 * @param {string} props.paymentId - 支払いID
 * @param {Function} props.onSuccess - 成功時のコールバック（オプション）
 */
export default function PaymentConfirmationEmail({ paymentId, onSuccess }) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">入金確認メール</h3>
      <p className="text-gray-600 mb-3">
        クライアントに入金確認のメールを送信します。
      </p>
      
      <SendEmailButton
        apiEndpoint="/api/email/sendPaymentConfirmation"
        data={{ paymentId }}
        buttonText="入金確認メールを送信"
        onSuccess={onSuccess}
      />
    </div>
  );
}
