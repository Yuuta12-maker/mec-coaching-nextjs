/**
 * このAPIはテスト用のサンプル支払いデータを作成するためのものです
 * 本番環境では削除してください
 */

import { withApiMiddleware } from '../../../lib/api-middleware';
import { addRow } from '../../../lib/sheets';
import { DB_TABLES, PAYMENT_STATUS } from '../../../lib/api-config';
import { v4 as uuidv4 } from 'uuid';

async function handler(req, res) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'テスト用APIは本番環境では使用できません' });
    }

    // 現在の日付
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // サンプルクライアントID
    const clientId = 'test-client-1';

    // 一意のIDを生成
    const paymentId = `test-payment-${uuidv4().substring(0, 8)}`;
    
    // サンプル支払いデータ
    const samplePayment = {
      支払いID: paymentId,
      クライアントID: clientId,
      項目: 'トライアルセッション',
      金額: 6000,
      状態: PAYMENT_STATUS.PAID,
      登録日: todayStr,
      入金日: todayStr,
      備考: 'テスト用支払いデータ'
    };

    // スプレッドシートに追加
    const result = await addRow(DB_TABLES.PAYMENT, samplePayment);

    return res.status(200).json({
      success: true,
      message: 'サンプル支払いデータを作成しました',
      payment: samplePayment
    });

  } catch (error) {
    console.error('サンプル支払いデータ作成エラー:', error);
    return res.status(500).json({
      error: 'サンプル支払いデータの作成に失敗しました',
      message: error.message
    });
  }
}

export default withApiMiddleware(handler);