/**
 * API関連の設定
 * このファイルはクライアントサイドでも読み込まれるため、シークレット情報は入れないこと
 */

// データ取得のエンドポイント
export const API_ENDPOINTS = {
  // クライアント関連
  CLIENTS: 'clients',
  CLIENT_DETAIL: (id) => `clients/${id}`,
  
  // セッション関連
  SESSIONS: 'sessions',
  SESSION_DETAIL: (id) => `sessions/${id}`,
  SESSION_CREATE: 'sessions/create',
  SESSION_UPDATE: 'sessions/update',
  
  // 支払い関連
  PAYMENTS: 'payments',
  PAYMENT_DETAIL: (id) => `payments/${id}`,
  PAYMENT_CREATE: 'payments/create',
  PAYMENT_UPDATE: 'payments/update',
  PAYMENT_CONFIRM: 'payments/confirm',
  PAYMENT_INVOICE: 'payments/generate-invoice',
  
  // 設定
  SETTINGS: 'settings',
};

// データベースのテーブル（シート）名
export const DB_TABLES = {
  CLIENT: 'クライアントinfo',
  SESSION: 'セッション管理',
  PAYMENT: '支払い管理',
  EMAIL_LOG: 'メールログ',
  SETTINGS: '設定'
};

// 支払い種別と金額の設定
export const PAYMENT_TYPES = {
  TRIAL_SESSION: {
    key: 'トライアルセッション',
    amount: 6000
  },
  CONTINUOUS_SESSION: {
    key: '継続セッション',
    amount: 214000
  },
  OTHER: {
    key: 'その他',
    amount: 0
  }
};

// 支払い状態
export const PAYMENT_STATUS = {
  UNPAID: '未入金',
  PAID: '入金済'
};

// クライアントステータス
export const CLIENT_STATUS = {
  INQUIRY: '問い合わせ',
  TRIAL_BEFORE: 'トライアル前',
  TRIAL_AFTER: 'トライアル済',
  CONTRACTED: '契約中',
  COMPLETED: '完了',
  SUSPENDED: '中断'
};

// セッション状態
export const SESSION_STATUS = {
  SCHEDULED: '予定',
  COMPLETED: '実施済',
  CANCELED: 'キャンセル'
};

// 企業情報
export const COMPANY_INFO = {
  name: 'マインドエンジニアリング・コーチング',
  representative: '森山 雄太',
  address: '東京都〇〇区〇〇〇〇1-2-3',
  tel: '03-XXXX-XXXX',
  email: 'mindengineeringcoaching@gmail.com',
  bankName: '〇〇銀行',
  branchName: '〇〇支店',
  accountType: '普通',
  accountNumber: 'XXXXXXX',
  accountName: 'マインドエンジニアリングコーチング',
  corporateColor: '#c50502'
};