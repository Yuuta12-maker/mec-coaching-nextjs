/**
 * シンプルなロガー
 * 開発/本番環境に応じてログレベルを調整
 */

const LOG_LEVELS = {
  ERROR: 0,   // エラーのみ
  WARN: 1,    // 警告とエラー
  INFO: 2,    // 情報、警告、エラー
  DEBUG: 3,   // デバッグ情報も含む（最も詳細）
  AUTH: 4,    // 認証関連のログ
};

// 環境に応じたログレベル設定
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

/**
 * フォーマット付きのログメッセージ出力
 */
function formatLog(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][${level.toUpperCase()}]`;
  
  // 詳細情報をJSON形式で出力
  if (args.length > 0) {
    // エラーオブジェクトを検出して特別処理
    const formattedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack,
          ...(arg.response ? { response: arg.response.data } : {})
        };
      }
      return arg;
    });
    
    console.log(`${prefix} ${message}`, ...formattedArgs);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

const logger = {
  error(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      formatLog('error', message, ...args);
    }
  },
  
  warn(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
      formatLog('warn', message, ...args);
    }
  },
  
  info(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
      formatLog('info', message, ...args);
    }
  },
  
  debug(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      formatLog('debug', message, ...args);
    }
  },
  
  auth(message, ...args) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.AUTH) {
      formatLog('auth', message, ...args);
    }
  },
  
  // エラーオブジェクトを詳細に出力するヘルパー
  logError(message, error) {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
      const details = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
      
      // Googleの特殊なエラーオブジェクト処理
      if (error.response && error.response.data) {
        details.responseData = error.response.data;
      }
      
      formatLog('error', message, details);
    }
  },
  
  // システム情報を出力（デバッグ用）
  logSystemInfo() {
    if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
      const info = {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
        env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || '未設定',
          SPREADSHEET_ID: process.env.SPREADSHEET_ID || '未設定',
          GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
            `設定済み (${process.env.GOOGLE_SERVICE_ACCOUNT_KEY.length}文字)` : '未設定',
        }
      };
      
      formatLog('system', 'システム情報', info);
    }
  }
};

export default logger;