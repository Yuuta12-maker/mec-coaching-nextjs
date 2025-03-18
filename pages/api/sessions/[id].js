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

    // URLからセッションIDを取得
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'セッションIDが必要です' });
    }

    // リクエストメソッドに応じた処理
    switch (req.method) {
      case 'GET':
        return await getSessionDetails(req, res, id);
      case 'PUT':
        return await updateSession(req, res, id);
      case 'POST':
        return await updateSessionStatus(req, res, id);
      default:
        return res.status(405).json({ error: '許可されていないメソッドです' });
    }
  } catch (error) {
    logger.error('セッション処理エラー:', error);
    return res.status(500).json({ 
      error: 'セッション処理に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
}

// セッション詳細を取得（クライアント情報も含む）
async function getSessionDetails(req, res, id) {
  try {
    logger.info(`セッション詳細取得: ID=${id}`);
    
    // セッション基本情報を取得
    const session = await findRowById(config.SHEET_NAMES.SESSION, id, 'セッションID');
    if (!session) {
      logger.warn(`セッションが見つかりません: ID=${id}`);
      return res.status(404).json({ error: 'セッションが見つかりません' });
    }

    // 関連するクライアント情報を取得
    let client = null;
    if (session.クライアントID) {
      client = await findRowById(
        config.SHEET_NAMES.CLIENT, 
        session.クライアントID, 
        'クライアントID'
      );
      
      if (client) {
        logger.info(`関連クライアント情報取得: ID=${session.クライアントID}`);
        // クライアント情報は必要な部分だけを返す
        client = {
          クライアントID: client.クライアントID,
          お名前: client.お名前,
          'お名前　（カナ）': client['お名前　（カナ）'],
          メールアドレス: client.メールアドレス,
          '電話番号　（ハイフンなし）': client['電話番号　（ハイフンなし）'],
          希望セッション形式: client.希望セッション形式,
          ステータス: client.ステータス
        };
      } else {
        logger.warn(`関連クライアントが見つかりません: ID=${session.クライアントID}`);
      }
    }

    return res.status(200).json({ 
      session,
      client
    });
  } catch (error) {
    logger.error(`セッション詳細取得エラー(ID=${id}):`, error);
    return res.status(500).json({ 
      error: 'セッション詳細の取得に失敗しました', 
      details: error.message 
    });
  }
}

// セッション情報を更新
async function updateSession(req, res, id) {
  try {
    logger.info(`セッション更新: ID=${id}`);
    
    // リクエストボディからデータを取得
    const updateData = req.body;
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: '更新データが必要です' });
    }

    // セッションが存在するか確認
    const existingSession = await findRowById(config.SHEET_NAMES.SESSION, id, 'セッションID');
    if (!existingSession) {
      logger.warn(`更新対象のセッションが見つかりません: ID=${id}`);
      return res.status(404).json({ error: '更新対象のセッションが見つかりません' });
    }
    
    // 更新不可のフィールドを削除
    delete updateData.セッションID; // IDは更新できないようにする
    delete updateData.登録日時; // 登録日時も更新できないようにする
    
    // 更新日時を設定
    updateData.更新日時 = new Date().toISOString();
    
    // スプレッドシートのデータを更新
    const updateResult = await updateRowById(
      config.SHEET_NAMES.SESSION, 
      id, 
      updateData, 
      'セッションID'
    );
    
    logger.info(`セッション更新成功: ID=${id}`);
    return res.status(200).json({ 
      success: true, 
      message: 'セッション情報を更新しました',
      result: updateResult
    });
  } catch (error) {
    logger.error(`セッション更新エラー(ID=${id}):`, error);
    return res.status(500).json({ 
      error: 'セッション情報の更新に失敗しました', 
      details: error.message 
    });
  }
}

// セッションステータスのみを更新（簡易更新）
async function updateSessionStatus(req, res, id) {
  try {
    logger.info(`セッションステータス更新: ID=${id}`);
    
    const { status, actionType } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'ステータスが必要です' });
    }

    // セッションが存在するか確認
    const existingSession = await findRowById(config.SHEET_NAMES.SESSION, id, 'セッションID');
    if (!existingSession) {
      logger.warn(`ステータス更新対象のセッションが見つかりません: ID=${id}`);
      return res.status(404).json({ error: 'ステータス更新対象のセッションが見つかりません' });
    }
    
    const updateData = {
      ステータス: status,
      更新日時: new Date().toISOString()
    };
    
    // セッション完了時の処理
    if (status === '実施済み') {
      updateData.実施日時 = new Date().toISOString();
    }
    
    // スプレッドシートのデータを更新
    const updateResult = await updateRowById(
      config.SHEET_NAMES.SESSION, 
      id, 
      updateData, 
      'セッションID'
    );
    
    logger.info(`セッションステータス更新成功: ID=${id}, 新ステータス=${status}`);
    return res.status(200).json({ 
      success: true, 
      message: `セッションステータスを「${status}」に更新しました`,
      result: updateResult,
      actionType
    });
  } catch (error) {
    logger.error(`セッションステータス更新エラー(ID=${id}):`, error);
    return res.status(500).json({ 
      error: 'セッションステータスの更新に失敗しました', 
      details: error.message 
    });
  }
}