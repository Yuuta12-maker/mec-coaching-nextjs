import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { findRowById, updateRowById, getSheetData } from '../../../lib/sheets';
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
        
        // withSessionsとwithPaymentsフラグの確認
        const withSessions = req.query.withSessions === 'true';
        const withPayments = req.query.withPayments === 'true';
        
        // レスポンスオブジェクトの準備
        const response = { client };
        
        // セッション情報の取得（オプション）
        if (withSessions) {
          try {
            // セッションシートから当該クライアントのセッションを取得
            const allSessions = await getSheetData('セッション管理');
            const clientSessions = allSessions.filter(session => 
              session.クライアントID === id
            );
            response.sessions = clientSessions;
          } catch (sessionError) {
            logger.error(`セッションデータ取得エラー - クライアントID: ${id}:`, sessionError);
            response.sessions = [];
          }
        }
        
        // 支払い情報の取得（オプション）
        if (withPayments) {
          try {
            // 支払いシートから当該クライアントの支払い情報を取得
            const allPayments = await getSheetData('支払い管理');
            const clientPayments = allPayments.filter(payment => 
              payment.クライアントID === id
            );
            response.payments = clientPayments;
          } catch (paymentError) {
            logger.error(`支払いデータ取得エラー - クライアントID: ${id}:`, paymentError);
            response.payments = [];
          }
        }
        
        logger.info(`クライアントID ${id} のデータ取得成功`);
        res.status(200).json(response);
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
        await updateRowById(CLIENT_SHEET, id, clientData, 'クライアントID');
        
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
