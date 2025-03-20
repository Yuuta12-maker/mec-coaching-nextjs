import { getSheetData } from '../../../lib/sheets';
import { withApiMiddleware, withGetMethod } from '../../../lib/api-middleware';
import { DB_TABLES } from '../../../lib/api-config';
import logger from '../../../lib/logger';

/**
 * クライアント一覧を取得するAPI
 * 
 * @param {Object} req - リクエストオブジェクト
 * @param {Object} res - レスポンスオブジェクト
 * @returns {Object} クライアント一覧データ
 */
async function handler(req, res) {
  try {
    logger.info('クライアント一覧の取得を開始');
    
    // クエリパラメータから各種フィルタリング条件を取得
    const { status, search, sort } = req.query;
    
    // クライアントデータを取得
    const clients = await getSheetData(DB_TABLES.CLIENT);
    
    // フィルタリング
    let filteredClients = [...clients];
    
    // 状態でフィルタリング
    if (status) {
      filteredClients = filteredClients.filter(client => client.ステータス === status);
    }
    
    // 検索キーワードでフィルタリング
    if (search) {
      const keyword = search.toLowerCase();
      filteredClients = filteredClients.filter(client => {
        // 名前
        const nameMatch = client.お名前 && client.お名前.toLowerCase().includes(keyword);
        
        // カナ名（オブジェクトのキーにブラケット記法でアクセス）
        const kanaField = "お名前　（カナ）";
        const kanaMatch = client[kanaField] && client[kanaField].toLowerCase().includes(keyword);
        
        // メールアドレス
        const emailMatch = client.メールアドレス && client.メールアドレス.toLowerCase().includes(keyword);
        
        // 電話番号
        const phoneField = "電話番号　（ハイフンなし）";
        const phoneMatch = client[phoneField] && client[phoneField].includes(keyword);
        
        return nameMatch || kanaMatch || emailMatch || phoneMatch;
      });
    }
    
    // ソート
    if (sort) {
      const [field, order] = sort.split(':');
      const isAsc = order !== 'desc';
      
      filteredClients.sort((a, b) => {
        let valueA, valueB;
        
        // 日付フィールド
        if (field === 'タイムスタンプ' || field === '生年月日') {
          valueA = new Date(a[field] || 0).getTime();
          valueB = new Date(b[field] || 0).getTime();
        } 
        // その他の文字列フィールド
        else {
          valueA = a[field] || '';
          valueB = b[field] || '';
        }
        
        // ソート順に応じて結果を返す
        if (isAsc) {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    } else {
      // デフォルトのソート（登録日の降順）
      filteredClients.sort((a, b) => 
        new Date(b.タイムスタンプ || 0) - new Date(a.タイムスタンプ || 0)
      );
    }
    
    logger.info(`クライアント ${filteredClients.length}件のデータを返却`);
    
    // レスポンスの形式を変更：クライアントコンポーネントで期待される形式に合わせる
    return res.status(200).json({
      clients: filteredClients
    });
    
  } catch (error) {
    logger.error('クライアント一覧取得エラー:', error);
    return res.status(500).json({ 
      error: 'クライアントデータの取得に失敗しました',
      message: error.message
    });
  }
}

// API ミドルウェアで GET メソッドのみに制限し、エラーハンドリングを追加
export default withApiMiddleware(withGetMethod(handler));