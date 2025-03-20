import { getSession } from 'next-auth/react';
import { findRowById, updateRowById, config } from '../../../lib/sheets';
import { PAYMENT_STATUS } from '../../../lib/api-config';
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

    const { 支払いID, 入金日 } = req.body;
    
    // 必須パラメータのバリデーション
    if (!支払いID) {
      return res.status(400).json({ error: '支払いIDは必須です' });
    }
    
    // 支払い情報を取得
    const payment = await findRowById(config.SHEET_NAMES.PAYMENT, 支払いID, '支払いID');
    
    if (!payment) {
      return res.status(404).json({ error: '指定された支払いが見つかりません' });
    }
    
    if (payment.状態 === PAYMENT_STATUS.PAID) {
      return res.status(400).json({ error: 'この支払いは既に入金済です' });
    }
    
    // 入金日（デフォルトは今日）
    const paymentDate = 入金日 || new Date().toISOString().split('T')[0];
    
    // 支払い状態を更新
    const result = await updateRowById(
      config.SHEET_NAMES.PAYMENT,
      支払いID,
      {
        状態: PAYMENT_STATUS.PAID,
        入金日: paymentDate
      },
      '支払いID'
    );
    
    logger.info(`入金確認を記録しました: ID=${支払いID}, 入金日=${paymentDate}`);
    
    // クライアント情報を取得
    const client = await findRowById(config.SHEET_NAMES.CLIENT, payment.クライアントID, 'クライアントID');
    const clientName = client ? client.お名前 : '不明';
    
    return res.status(200).json({
      success: true,
      message: `${clientName}様の支払い(${payment.金額.toLocaleString()}円)を入金確認しました`,
      paymentId: 支払いID,
      paymentDate: paymentDate
    });
    
  } catch (error) {
    logger.error('入金確認エラー:', error);
    return res.status(500).json({ error: `入金確認に失敗しました: ${error.message}` });
  }
}