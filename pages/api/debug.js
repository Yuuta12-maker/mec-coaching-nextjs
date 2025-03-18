import { testConnection } from '../../lib/sheets';
import logger from '../../lib/logger';

/**
 * デバッグ用API
 * 開発環境でのトラブルシューティングに使用
 */
export default async function handler(req, res) {
  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'このエンドポイントは開発環境でのみ有効です' });
  }

  try {
    logger.info('デバッグAPIが呼び出されました');
    logger.logSystemInfo();

    // 環境変数の状態確認（機密情報は一部マスク）
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '未設定',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '設定済み' : '未設定',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '設定済み' : '未設定',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '設定済み' : '未設定',
      SPREADSHEET_ID: process.env.SPREADSHEET_ID || '未設定',
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
        `設定済み (${process.env.GOOGLE_SERVICE_ACCOUNT_KEY.length}文字)` : '未設定',
    };

    // サービスアカウントキーのJSONパース確認
    let serviceAccountInfo = null;
    try {
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        serviceAccountInfo = {
          type: parsed.type || '不明',
          project_id: parsed.project_id || '不明',
          client_email: parsed.client_email || '不明',
          private_key_exists: !!parsed.private_key,
          fields: Object.keys(parsed),
        };
      }
    } catch (parseError) {
      serviceAccountInfo = {
        error: '有効なJSONではありません',
        message: parseError.message,
      };
    }

    // スプレッドシートへの接続テスト
    let connectionTest = null;
    try {
      connectionTest = await testConnection();
    } catch (testError) {
      connectionTest = {
        success: false,
        error: testError.message,
        stack: process.env.NODE_ENV === 'development' ? testError.stack : undefined,
      };
    }

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      environment: envInfo,
      serviceAccountInfo,
      connectionTest,
      message: 'デバッグ情報が生成されました'
    });
  } catch (error) {
    logger.error('デバッグAPI実行エラー:', error);
    return res.status(500).json({ 
      error: 'デバッグ情報の生成に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}