import { findRowById, updateRowById, config, testConnection } from '../../../lib/sheets';
import { getSession } from 'next-auth/react';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  // セッションチェック（認証済みかどうか - 開発中はコメントアウト可）
  /*
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  */

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
    logger.info(`支払い詳細取得API呼び出し開始: ID=${id}`);
    
    // まず接続テストを実行
    try {
      logger.info('スプレッドシート接続テスト実行');
      const testResult = await testConnection();
      logger.info(`接続テスト結果: ${JSON.stringify(testResult)}`);
    } catch (testError) {
      logger.error('接続テストエラー:', testError);
      return res.status(500).json({ 
        error: 'スプレッドシートへの接続テストに失敗しました', 
        details: testError.message,
        stack: process.env.NODE_ENV === 'development' ? testError.stack : undefined
      });
    }
    
    const payment = await findRowById(config.SHEET_NAMES.PAYMENT, id, '支払いID');
    
    if (!payment) {
      logger.warn(`支払い記録が見つかりません: ID=${id}`);
      return res.status(404).json({ error: '指定された支払い記録が見つかりません' });
    }
    
    logger.info(`支払い詳細取得成功: ID=${id}`);
    
    // 金額データの正規化
    if (payment['金額'] !== undefined) {
      // 数値に変換を試みる
      const amount = payment['金額'].toString();
      const numericAmount = parseFloat(amount.replace(/[^0-9.-]/g, ''));
      
      if (!isNaN(numericAmount)) {
        payment['金額'] = numericAmount;
      } else {
        logger.warn(`不正な金額データ: ${payment['金額']}`);
        payment['金額'] = 0; // デフォルト値として0を設定
      }
    }
    
    // クライアント名の追加（可能な場合）
    try {
      if (payment['クライアントID']) {
        const client = await findRowById(config.SHEET_NAMES.CLIENT, payment['クライアントID'], 'クライアントID');
        if (client) {
          payment['クライアント名'] = client['お名前'] || '不明';
        }
      }
    } catch (clientError) {
      logger.warn('クライアント情報取得エラー:', clientError);
      // クライアント情報の取得に失敗しても支払い情報は返す
    }
    
    return res.status(200).json(payment);
  } catch (error) {
    logger.error('支払い情報取得エラー:', error);
    return res.status(500).json({ 
      error: '支払い情報の取得に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * 支払い情報を更新する関数（主に入金確認用）
 */
async function updatePayment(req, res, id) {
  try {
    logger.info(`支払い情報更新API呼び出し開始: ID=${id}`);
    const data = req.body;
    
    // 支払い記録が存在するか確認
    const existingPayment = await findRowById(config.SHEET_NAMES.PAYMENT, id, '支払いID');
    if (!existingPayment) {
      logger.warn(`支払い記録が見つかりません: ID=${id}`);
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
    if (updateData['金額'] !== undefined) {
      let amount;
      
      if (typeof updateData['金額'] === 'number') {
        amount = updateData['金額'];
      } else if (typeof updateData['金額'] === 'string') {
        // 文字列から数値への変換（カンマや記号を除去）
        const cleanedAmount = updateData['金額'].replace(/[^0-9.-]/g, '');
        amount = parseFloat(cleanedAmount);
      } else {
        amount = NaN;
      }
      
      if (isNaN(amount)) {
        logger.warn(`不正な金額フォーマット: ${updateData['金額']}`);
        return res.status(400).json({ error: '金額は数値で入力してください' });
      }
      
      updateData['金額'] = amount; // 数値型に変換
    }
    
    logger.info(`支払い情報更新内容: ${JSON.stringify(updateData)}`);
    
    // スプレッドシートを更新
    await updateRowById(config.SHEET_NAMES.PAYMENT, id, updateData, '支払いID');
    
    logger.info(`支払い情報更新成功: ID=${id}`);
    return res.status(200).json({ 
      success: true, 
      message: '支払い情報を更新しました',
      paymentId: id
    });
  } catch (error) {
    logger.error('支払い更新エラー:', error);
    return res.status(500).json({ 
      error: '支払い情報の更新に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
