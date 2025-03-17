import { findRowById, updateRowById, config } from '../../../lib/sheets';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // セッションチェック（認証済みかどうか）
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  // 支払いIDを取得
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: '支払いIDが必要です' });
  }

  // リクエストメソッドに応じた処理分岐
  switch (req.method) {
    case 'GET':
      // 特定の支払い情報を取得
      return await getPayment(req, res, id);
    case 'PUT':
      // 支払い情報を更新
      return await updatePayment(req, res, id);
    default:
      return res.status(405).json({ error: 'メソッドが許可されていません' });
  }
}

/**
 * 特定の支払い情報を取得する関数
 */
async function getPayment(req, res, id) {
  try {
    const payment = await findRowById(config.SHEET_NAMES.PAYMENT, id, '支払いID');
    
    if (!payment) {
      return res.status(404).json({ error: '指定された支払い記録が見つかりません' });
    }
    
    return res.status(200).json(payment);
  } catch (error) {
    console.error('支払い情報取得エラー:', error);
    return res.status(500).json({ error: '支払い情報の取得に失敗しました' });
  }
}

/**
 * 支払い情報を更新する関数（主に入金確認用）
 */
async function updatePayment(req, res, id) {
  try {
    const data = req.body;
    
    // 支払い記録が存在するか確認
    const existingPayment = await findRowById(config.SHEET_NAMES.PAYMENT, id, '支払いID');
    if (!existingPayment) {
      return res.status(404).json({ error: '指定された支払い記録が見つかりません' });
    }
    
    // 更新不可のフィールドを除外
    const updateData = { ...data };
    delete updateData['支払いID']; // IDは更新不可
    delete updateData['クライアントID']; // クライアントIDは変更不可
    delete updateData['登録日']; // 登録日は変更不可
    
    // 入金確認の場合の処理
    if (updateData['状態'] === '入金済み' && !updateData['入金日']) {
      const today = new Date();
      updateData['入金日'] = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
    }
    
    // 金額のフォーマットチェック（更新する場合）
    if (updateData['金額']) {
      const amount = parseInt(updateData['金額']);
      if (isNaN(amount)) {
        return res.status(400).json({ error: '金額は数値で入力してください' });
      }
      updateData['金額'] = amount; // 数値型に変換
    }
    
    // スプレッドシートを更新
    await updateRowById(config.SHEET_NAMES.PAYMENT, id, updateData, '支払いID');
    
    return res.status(200).json({ 
      success: true, 
      message: '支払い情報を更新しました',
      paymentId: id
    });
  } catch (error) {
    console.error('支払い更新エラー:', error);
    return res.status(500).json({ error: '支払い情報の更新に失敗しました' });
  }
}