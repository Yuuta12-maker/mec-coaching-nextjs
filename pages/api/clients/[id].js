import { findRowById, updateRowById, getSheetData, config } from '../../../lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  try {
    // 認証チェック（開発中は一時的にコメントアウトも可）
    /*
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: '認証が必要です' });
    }
    */

    // URLからクライアントIDを取得
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'クライアントIDが必要です' });
    }

    // メソッドに応じた処理
    switch (req.method) {
      case 'GET':
        return await getClientDetails(req, res, id);
      case 'PUT':
        return await updateClient(req, res, id);
      default:
        return res.status(405).json({ error: '許可されていないメソッドです' });
    }
  } catch (error) {
    logger.error('クライアント処理エラー:', error);
    return res.status(500).json({ 
      error: 'クライアント処理に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}

// クライアント詳細（セッション・支払い情報も含む）を取得
async function getClientDetails(req, res, id) {
  try {
    logger.info(`クライアント詳細取得: ID=${id}`);
    
    // クライアント基本情報を取得
    const client = await findRowById(config.SHEET_NAMES.CLIENT, id, 'クライアントID');
    if (!client) {
      logger.warn(`クライアントが見つかりません: ID=${id}`);
      return res.status(404).json({ error: 'クライアントが見つかりません' });
    }

    // 関連情報の取得フラグ
    const { withSessions, withPayments } = req.query;
    let sessions = [];
    let payments = [];

    // クライアントに関連するセッション情報を取得
    if (withSessions === 'true') {
      logger.info(`クライアント ${id} のセッション情報を取得します`);
      const allSessions = await getSheetData(config.SHEET_NAMES.SESSION);
      sessions = allSessions.filter(session => 
        session.クライアントID === id
      ).sort((a, b) => {
        // 日付の降順（新しい順）
        return new Date(b.予定日時 || 0) - new Date(a.予定日時 || 0);
      });
      logger.info(`クライアント ${id} のセッション ${sessions.length}件を取得しました`);
    }

    // クライアントに関連する支払い情報を取得
    if (withPayments === 'true') {
      logger.info(`クライアント ${id} の支払い情報を取得します`);
      const allPayments = await getSheetData(config.SHEET_NAMES.PAYMENT);
      payments = allPayments.filter(payment => 
        payment.クライアントID === id
      ).sort((a, b) => {
        // 日付の降順（新しい順）
        return new Date(b.登録日 || 0) - new Date(a.登録日 || 0);
      });
      logger.info(`クライアント ${id} の支払い ${payments.length}件を取得しました`);
    }

    return res.status(200).json({ 
      client, 
      sessions: withSessions === 'true' ? sessions : undefined,
      payments: withPayments === 'true' ? payments : undefined
    });
  } catch (error) {
    logger.error(`クライアント詳細取得エラー(ID=${id}):`, error);
    return res.status(500).json({ 
      error: 'クライアント詳細の取得に失敗しました', 
      details: error.message 
    });
  }
}

// クライアント情報を更新
async function updateClient(req, res, id) {
  try {
    logger.info(`クライアント更新: ID=${id}`);
    
    // リクエストボディからデータを取得
    const updateData = req.body;
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '更新データが必要です' });
    }

    // クライアントが存在するか確認
    const existingClient = await findRowById(config.SHEET_NAMES.CLIENT, id, 'クライアントID');
    if (!existingClient) {
      logger.warn(`更新対象のクライアントが見つかりません: ID=${id}`);
      return res.status(404).json({ error: '更新対象のクライアントが見つかりません' });
    }
    
    // 更新不可のフィールドを削除（任意）
    delete updateData.クライアントID; // IDは更新できないようにする
    delete updateData.タイムスタンプ; // タイムスタンプも更新できないようにする
    
    // 更新日時を設定
    updateData.更新日時 = new Date().toISOString();
    
    // スプレッドシートのデータを更新
    const updateResult = await updateRowById(
      config.SHEET_NAMES.CLIENT, 
      id, 
      updateData, 
      'クライアントID'
    );
    
    logger.info(`クライアント更新成功: ID=${id}`);
    return res.status(200).json({ 
      success: true, 
      message: 'クライアント情報を更新しました',
      result: updateResult
    });
  } catch (error) {
    logger.error(`クライアント更新エラー(ID=${id}):`, error);
    return res.status(500).json({ 
      error: 'クライアント情報の更新に失敗しました', 
      details: error.message 
    });
  }
}