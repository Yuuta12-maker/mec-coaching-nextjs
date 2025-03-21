import { PaymentConfirmationEmail } from '../email';

/**
 * 支払いメール送信セクションコンポーネント
 * @param {Object} props - コンポーネントプロパティ
 * @param {Object} props.payment - 支払い情報
 * @param {boolean} props.disabled - 無効状態
 * @param {Function} props.onSuccess - 成功時のコールバック
 */
export default function PaymentEmailSection({ payment, disabled = false, onSuccess }) {
  if (!payment) return null;

  // 入金済みの場合のみ表示
  const isPaid = payment.状態 === '入金済み';
  
  if (!isPaid) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-md">
        <p className="flex items-center">
          <span className="material-icons text-yellow-600 mr-2 text-sm">info</span>
          入金確認後にメールを送信できます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        入金確認メールをクライアントに送信します。
      </p>
      
      <PaymentConfirmationEmail
        paymentId={payment.支払いID}
        onSuccess={onSuccess}
      />
    </div>
  );
}
