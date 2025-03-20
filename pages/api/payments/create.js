import { getSession } from 'next-auth/react';
import { addRow, config } from '../../../lib/sheets';
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
    
    // 支払いIDがない場合は生成
    if (!data.支払いID) {
      data.支払いID = `payment_${Date.now()}`;
    }
    
    // スプレッドシートに支払いデータを追加
    const result = await addRow(config.SHEET_NAMES.PAYMENT, data);
    
    logger.info(`新規支払いを登録しました: ID=${data.支払いID}, クライアント=${data.クライアントID}, 金額=${data.金額}円`);
    
    return res.status(200).json({
      success: true,
      message: '支払いデータを登録しました',
      paymentId: data.支払いID
    });
    
  } catch (error) {
    logger.error('支払いデータ登録エラー:', error);
    return res.status(500).json({ error: `支払いデータの登録に失敗しました: ${error.message}` });
  }
}