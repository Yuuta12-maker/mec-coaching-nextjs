import { getSession } from 'next-auth/react';
import { updateRowById, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  // POSTリクエストのみを許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッションチェック（認証されたユーザーのみ許可）
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = req.body;
    
    // 必須パラメータのバリデーション
    if (!data.支払いID) {
      return res.status(400).json({ error: '支払いIDは必須です' });
    }
    
    if (!data.クライアントID) {
      return res.status(400).json({ error: 'クライアントIDは必須です' });
    }
    
    if (!data.項目) {
      return res.status(400).json({ error: '項目は必須です' });
    }
    
    if (data.金額 === undefined || data.金額 === null || isNaN(data.金額)) {
      return res.status(400).json({ error: '有効な金額を指定してください' });
    }
    
    if (!data.状態) {
      return res.status(400).json({ error: '状態は必須です' });
    }
    
    // 入金済みの場合は入金日が必須
    if (data.状態 === '入金済み' && !data.入金日) {
      return res.status(400).json({ error: '入金済みの場合は入金日が必須です' });
    }
    
    // スプレッドシートの支払いデータを更新
    const result = await updateRowById(
      config.SHEET_NAMES.PAYMENT,
      data.支払いID,
      data,
      '支払いID'
    );
    
    logger.info(`支払いを更新しました: ID=${data.支払いID}, クライアント=${data.クライアントID}, 金額=${data.金額}円`);
    
    return res.status(200).json({
      success: true,
      message: '支払いデータを更新しました',
      paymentId: data.支払いID
    });
    
  } catch (error) {
    logger.error('支払いデータ更新エラー:', error);
    return res.status(500).json({ error: `支払いデータの更新に失敗しました: ${error.message}` });
  }
}