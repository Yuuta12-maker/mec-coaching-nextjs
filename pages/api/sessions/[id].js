import { findRowById, updateRowById, config } from '../../../lib/sheets';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // セッションチェック（認証済みかどうか）
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  // セッションIDを取得
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'セッションIDが必要です' });
  }

  // リクエストメソッドに応じた処理分岐
  switch (req.method) {
    case 'GET':
      // 特定のセッション情報を取得
      return await getSessionById(req, res, id);
    case 'PUT':
      // セッション情報を更新
      return await updateSession(req, res, id);
    case 'DELETE':
      // セッションを削除（実際はスケジュール削除や取り消しなど）
      return res.status(501).json({ error: '削除機能は現在準備中です' });
    default:
      return res.status(405).json({ error: 'メソッドが許可されていません' });
  }
}

/**
 * 特定のセッション情報を取得する関数
 */
async function getSessionById(req, res, id) {
  try {
    const sessionData = await findRowById(config.SHEET_NAMES.SESSION, id, 'セッションID');
    
    if (!sessionData) {
      return res.status(404).json({ error: '指定されたセッションが見つかりません' });
    }
    
    return res.status(200).json(sessionData);
  } catch (error) {
    console.error('セッション情報取得エラー:', error);
    return res.status(500).json({ error: 'セッション情報の取得に失敗しました' });
  }
}

/**
 * セッション情報を更新する関数
 */
async function updateSession(req, res, id) {
  try {
    const data = req.body;
    
    // セッションが存在するか確認
    const existingSession = await findRowById(config.SHEET_NAMES.SESSION, id, 'セッションID');
    if (!existingSession) {
      return res.status(404).json({ error: '指定されたセッションが見つかりません' });
    }
    
    // 更新不可のフィールドを除外
    const updateData = { ...data };
    delete updateData['セッションID']; // IDは更新不可
    
    // 日時のフォーマットチェック（更新する場合）
    if (updateData['予定日時'] && isNaN(new Date(updateData['予定日時']).getTime())) {
      return res.status(400).json({ error: '予定日時の形式が正しくありません' });
    }
    
    // 実施日時の更新（セッション完了時など）
    if (updateData['ステータス'] === '完了' && !updateData['実施日時']) {
      updateData['実施日時'] = new Date().toISOString();
    }
    
    // 最終更新日時を追加
    updateData['最終更新日時'] = new Date().toISOString();
    
    // スプレッドシートを更新
    await updateRowById(config.SHEET_NAMES.SESSION, id, updateData, 'セッションID');
    
    return res.status(200).json({ 
      success: true, 
      message: 'セッション情報を更新しました',
      sessionId: id
    });
  } catch (error) {
    console.error('セッション更新エラー:', error);
    return res.status(500).json({ error: 'セッション情報の更新に失敗しました' });
  }
}