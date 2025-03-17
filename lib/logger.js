/**
 * シンプルなロガーユーティリティ
 * サーバーサイドとクライアントサイドの両方で動作する
 */

const logger = {
  // エラーログ
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  // 警告ログ
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  // 情報ログ
  info: (message, ...args) => {
    console.info(`[INFO] ${message}`, ...args);
  },
  
  // デバッグログ（開発環境のみ）
  debug: (message, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  // 認証関連のログ
  auth: (message, ...args) => {
    console.log(`[AUTH] ${message}`, ...args);
  }
};

export default logger;