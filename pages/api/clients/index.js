import { getSheetData, config, testConnection } from '../../../lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import logger from '../../../lib/logger';
import { CLIENT_STATUS } from '../../../lib/constants';

export default async function handler(req, res) {
  // リクエストメソッドチェック
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  try {
    // 認証チェック - 一時的にコメントアウト（開発中のテスト用）
    /*
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: '認証が必要です' });
    }
    */

    // クエリパラメータを取得 (フィルタリング用)
    const { status, search } = req.query;

    logger.info('クライアント一覧取得API呼び出し開始');
    
    // 先に接続テストを実行
    try {
      logger.info('スプレッドシート接続テスト実行');
      const testResult = await testConnection();
      logger.info(`接続テスト結果: ${JSON.stringify(testResult)}`);
    } catch (testError) {
      logger.error('接続テストエラー:', testError);
      return res.status(500).json({ 
        error: 'スプレッドシートへの接続テストに失敗しました', 
        details: testError.message,
        stack: process.env.NODE_ENV === 'development' ? testError.stack : undefined
      });
    }
    
    // スプレッドシートからクライアントデータを取得
    let clients = [];
    try {
      logger.info(`クライアントデータ取得開始: シート「${config.SHEET_NAMES.CLIENT}」`);
      clients = await getSheetData(config.SHEET_NAMES.CLIENT);
      logger.info(`クライアントデータ取得成功: ${clients.length}件`);
    } catch (sheetError) {
      logger.error('スプレッドシート取得エラーの詳細:', sheetError);
      return res.status(500).json({ 
        error: 'スプレッドシートからのデータ取得に失敗しました', 
        details: sheetError.message,
        stack: process.env.NODE_ENV === 'development' ? sheetError.stack : undefined
      });
    }

    // ステータスでフィルタリング
    if (status) {
      logger.debug(`ステータスでフィルタリング: ${status}`);
      
      // 改善：直接のステータス比較に加えて、クライアントステータス定数との比較も行う
      clients = clients.filter(client => {
        // 正規化：clients.ステータスを取得（ないなら空文字）
        const clientStatus = client.ステータス || '';
        
        // 直接比較
        if (clientStatus === status) return true;
        
        // 定数値から検索
        const isMatchingStatus = Object.values(CLIENT_STATUS).some(
          statusValue => statusValue === status && statusValue === clientStatus
        );
        
        return isMatchingStatus;
      });
    }

    // 検索キーワードでフィルタリング
    if (search) {
      logger.debug(`検索キーワードでフィルタリング: ${search}`);
      const searchLower = search.toLowerCase();
      clients = clients.filter(client => 
        (client.お名前 && client.お名前.toLowerCase().includes(searchLower)) ||
        (client['お名前　（カナ）'] && client['お名前　（カナ）'].toLowerCase().includes(searchLower)) ||
        (client.メールアドレス && client.メールアドレス.toLowerCase().includes(searchLower))
      );
    }

    // 個人情報の一部を隠蔽（APIレスポンスで全データを返さない）
    const safeClients = clients.map(client => ({
      クライアントID: client.クライアントID || `C${Date.now()}`, // IDがない場合は仮のIDを生成
      お名前: client.お名前 || '名前なし',
      'お名前　（カナ）': client['お名前　（カナ）'] || '',
      ステータス: client.ステータス || '未設定',
      メールアドレス: client.メールアドレス || '',
      タイムスタンプ: client.タイムスタンプ || '',
      希望セッション形式: client.希望セッション形式 || '',
    }));

    logger.info(`クライアント一覧取得API完了: ${safeClients.length}件のデータを返します`);
    return res.status(200).json({ clients: safeClients });
  } catch (error) {
    logger.error('クライアント一覧取得API全体エラー:', error);
    return res.status(500).json({ 
      error: 'クライアントの取得に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}