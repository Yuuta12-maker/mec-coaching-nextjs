import { testConnection, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  try {
    logger.info('接続テストAPI呼び出し開始');
    
    // 環境変数情報（センシティブな情報は除外）
    const envInfo = {
      SPREADSHEET_ID: process.env.SPREADSHEET_ID || '(設定なし - デフォルト値使用)',
      NODE_ENV: process.env.NODE_ENV,
      HAS_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'あり' : 'なし',
      SHEET_NAMES: config.SHEET_NAMES,
    };
    
    logger.info('環境変数情報:', envInfo);
    
    // スプレッドシート接続テスト
    const result = await testConnection();
    logger.info('接続テスト結果:', result);
    
    return res.status(200).json({
      success: true, 
      message: `スプレッドシートに接続できました: "${result.spreadsheetTitle}"`,
      env: envInfo,
      result
    });
  } catch (error) {
    logger.error('接続テストエラー:', error);
    
    return res.status(500).json({ 
      error: 'スプレッドシートへの接続テストに失敗しました', 
      message: error.message,
      detail: error.stack,
      env: {
        SPREADSHEET_ID: process.env.SPREADSHEET_ID ? '設定あり' : '設定なし',
        HAS_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'あり' : 'なし',
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  }
}
