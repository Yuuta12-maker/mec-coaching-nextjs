import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getSheetData } from '../../../lib/sheets';
import logger from '../../../lib/logger';

// シート名の定数
const CLIENT_SHEET = 'クライアントinfo';

export default async function handler(req, res) {
  try {
    // 認証チェック
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      try {
        logger.info('クライアントデータ取得開始 - Google Sheets APIを使用');
        
        // Google Sheetsからクライアントデータを取得
        const clients = await getSheetData(CLIENT_SHEET);
        
        logger.info(`クライアントデータ取得完了: ${clients.length}件`);
        
        // 検索とフィルタリング（クエリパラメータから）
        const { status, search } = req.query;
        let filteredClients = [...clients];
        
        // ステータスでフィルタリング
        if (status && status !== 'all') {
          filteredClients = filteredClients.filter(client => 
            client.ステータス === status
          );
        }
        
        // 検索キーワードでフィルタリング
        if (search) {
          const searchLower = search.toLowerCase();
          filteredClients = filteredClients.filter(client => 
            (client.お名前 && client.お名前.toLowerCase().includes(searchLower)) ||
            (client['お名前　（カナ）'] && client['お名前　（カナ）'].toLowerCase().includes(searchLower)) ||
            (client.メールアドレス && client.メールアドレス.toLowerCase().includes(searchLower))
          );
        }
        
        // クライアントデータを返す
        res.status(200).json(filteredClients);
      } catch (error) {
        logger.error('クライアントデータ取得エラー:', error);
        res.status(500).json({ 
          error: 'Failed to fetch clients', 
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    } else if (req.method === 'POST') {
      // 新規クライアント作成のロジックはこちらに
      // ... 
      res.status(501).json({ error: 'Not implemented yet' });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    logger.error('API全体エラー:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
