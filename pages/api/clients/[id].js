import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { findRowById, updateRow, getSheetData } from '../../../lib/sheets';
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

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    if (req.method === 'GET') {
      try {
        logger.info(`クライアントID ${id} のデータ取得開始`);
        
        // Google Sheetsから特定のクライアントを検索
        const client = await findRowById(CLIENT_SHEET, id, 'クライアントID');
        
        if (!client) {
          logger.warn(`クライアントID ${id} は見つかりませんでした`);
          return res.status(404).json({ error: 'Client not found' });
        }
        
        logger.info(`クライアントID ${id} のデータ取得成功`);
        res.status(200).json(client);
      } catch (error) {
        logger.error(`クライアント取得エラー - ID:${id}:`, error);
        res.status(500).json({ 
          error: 'Failed to fetch client', 
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    } else if (req.method === 'PUT') {
      try {
        logger.info(`クライアントID ${id} の更新開始`);
        
        const clientData = req.body;
        
        // 既存のクライアントを確認
        const existingClient = await findRowById(CLIENT_SHEET, id, 'クライアントID');
        if (!existingClient) {
          logger.warn(`更新対象のクライアントID ${id} は見つかりませんでした`);
          return res.status(404).json({ error: 'Client not found' });
        }
        
        // クライアントデータ更新
        await updateRow(CLIENT_SHEET, id, 'クライアントID', clientData);
        
        // 更新後のデータを取得
        const updatedClient = await findRowById(CLIENT_SHEET, id, 'クライアントID');
        
        logger.info(`クライアントID ${id} の更新成功`);
        res.status(200).json(updatedClient);
      } catch (error) {
        logger.error(`クライアント更新エラー - ID:${id}:`, error);
        res.status(500).json({ 
          error: 'Failed to update client', 
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    } else if (req.method === 'DELETE') {
      try {
        // 現在は削除機能が実装されていないため、エラーを返す
        logger.warn(`クライアント削除機能は実装されていません - ID:${id}`);
        res.status(501).json({ 
          error: 'Delete operation not implemented', 
          message: 'クライアントの削除機能は現在利用できません'
        });
      } catch (error) {
        logger.error(`クライアント削除エラー - ID:${id}:`, error);
        res.status(500).json({ 
          error: 'Failed to delete client', 
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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
