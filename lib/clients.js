// クライアント関連のユーティリティ関数

/**
 * クライアントステータスの定義
 */
export const CLIENT_STATUS = {
  INQUIRY: '問合せ',
  TRIAL: 'トライアル予約済',
  TRIAL_COMPLETED: 'トライアル実施済',
  CONTINUING: '継続中',
  COMPLETED: '完了',
  DELETED: '削除済み'
};

/**
 * セッションタイプの定義
 */
export const SESSION_TYPES = {
  TRIAL: 'トライアルセッション',
  REGULAR: '通常セッション',
  FOLLOW_UP: 'フォローアップ'
};

/**
 * クライアントステータスに基づく色の取得
 * @param {string} status - クライアントのステータス
 * @returns {string} - 対応するTailwind CSSのクラス名
 */
export function getStatusColor(status) {
  switch (status) {
    case CLIENT_STATUS.INQUIRY:
      return 'bg-blue-100 text-blue-800';
    case CLIENT_STATUS.TRIAL:
      return 'bg-purple-100 text-purple-800';
    case CLIENT_STATUS.TRIAL_COMPLETED:
      return 'bg-indigo-100 text-indigo-800';
    case CLIENT_STATUS.CONTINUING:
      return 'bg-green-100 text-green-800';
    case CLIENT_STATUS.COMPLETED:
      return 'bg-gray-100 text-gray-800';
    case CLIENT_STATUS.DELETED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * クライアントの次のステータスを取得
 * @param {string} currentStatus - 現在のステータス
 * @returns {string} - 次のステータス
 */
export function getNextStatus(currentStatus) {
  switch (currentStatus) {
    case CLIENT_STATUS.INQUIRY:
      return CLIENT_STATUS.TRIAL;
    case CLIENT_STATUS.TRIAL:
      return CLIENT_STATUS.TRIAL_COMPLETED;
    case CLIENT_STATUS.TRIAL_COMPLETED:
      return CLIENT_STATUS.CONTINUING;
    case CLIENT_STATUS.CONTINUING:
      return CLIENT_STATUS.COMPLETED;
    default:
      return currentStatus;
  }
}

/**
 * クライアント情報のバリデーション
 * @param {Object} clientData - クライアントデータ
 * @returns {Object} - エラーメッセージの配列
 */
export function validateClientData(clientData) {
  const errors = {};
  
  if (!clientData.お名前) {
    errors.お名前 = 'お名前は必須です';
  }
  
  if (!clientData.メールアドレス) {
    errors.メールアドレス = 'メールアドレスは必須です';
  } else if (!/\S+@\S+\.\S+/.test(clientData.メールアドレス)) {
    errors.メールアドレス = 'メールアドレスの形式が正しくありません';
  }
  
  if (clientData['電話番号　（ハイフンなし）'] && !/^\d+$/.test(clientData['電話番号　（ハイフンなし）'])) {
    errors['電話番号　（ハイフンなし）'] = '電話番号は数字のみで入力してください';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * クライアントIDを生成
 * @returns {string} - 生成されたクライアントID
 */
export function generateClientId() {
  return 'C' + Date.now().toString();
}

/**
 * セッションIDを生成
 * @returns {string} - 生成されたセッションID
 */
export function generateSessionId() {
  return 'S' + Date.now().toString();
}

/**
 * 支払いIDを生成
 * @returns {string} - 生成された支払いID
 */
export function generatePaymentId() {
  return 'P' + Date.now().toString();
}