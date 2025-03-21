/**
 * マインドエンジニアリング・コーチング管理システムの定数設定
 * スプレッドシートと同期するための値を定義
 */

// クライアントステータス
export const CLIENT_STATUS = {
  ALL: 'すべて', // フィルター用
  INQUIRY: '問い合わせ', // 「問合せ」から「問い合わせ」に変更
  TRIAL_BEFORE: 'トライアル前', // 「トライアル予約済」から「トライアル前」に変更
  TRIAL_AFTER: 'トライアル済',
  ONGOING: '契約中', // 「継続中」から「契約中」に変更
  COMPLETED: '完了',
  SUSPENDED: '中断', // 新たに追加
};

// セッションステータス
export const SESSION_STATUS = {
  SCHEDULED: '予定',
  COMPLETED: '実施済',
  CANCELED: 'キャンセル',
  POSTPONED: '延期',
};

// セッション種別
export const SESSION_TYPE = {
  TRIAL: 'トライアル',
  CONTINUATION_1: '継続（1回目）',
  CONTINUATION_2: '継続（2回目）',
  CONTINUATION_3: '継続（3回目）',
  CONTINUATION_4: '継続（4回目）',
  CONTINUATION_5: '継続（5回目）',
  CUSTOM: 'カスタム',
};

// 支払い状態
export const PAYMENT_STATUS = {
  ALL: 'すべて', // フィルター用
  PAID: '入金済', // 「入金済み」から「入金済」に変更
  UNPAID: '未入金', // 「未払い」から「未入金」に変更
  CANCELED: 'キャンセル',
};

// 支払い項目
export const PAYMENT_ITEM = {
  TRIAL: 'トライアルセッション',
  CONTINUATION: '継続セッション（全5回）',
};

// 性別
export const GENDER = {
  MALE: '男性',
  FEMALE: '女性',
  OTHER: 'その他',
  NO_ANSWER: '回答しない',
};

// セッション形式
export const SESSION_FORMAT = {
  ONLINE: 'オンライン',
  IN_PERSON: '対面',
  EITHER: 'どちらでも可',
};

// 金額設定
export const PRICE = {
  TRIAL: 6000,
  CONTINUATION: 214000,
};

// コーポレートカラー
export const CORPORATE_COLOR = '#c50502';

export default {
  CLIENT_STATUS,
  SESSION_STATUS,
  SESSION_TYPE,
  PAYMENT_STATUS,
  PAYMENT_ITEM,
  GENDER,
  SESSION_FORMAT,
  PRICE,
  CORPORATE_COLOR,
};