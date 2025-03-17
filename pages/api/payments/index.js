import { getSheetData, addRow, config } from '../../../lib/sheets';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // セッションチェック（認証済みかどうか）
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  // リクエストメソッドに応じた処理分岐
  switch (req.method) {
    case 'GET':
      // 支払い一覧を取得
      return await getPayments(req, res);
    case 'POST':
      // 新規支払い記録を登録
      return await createPayment(req, res);
    default:
      return res.status(405).json({ error: 'メソッドが許可されていません' });
  }
}

/**
 * 支払い一覧を取得する関数
 */
async function getPayments(req, res) {
  try {
    const payments = await getSheetData(config.SHEET_NAMES.PAYMENT);
    
    // フィルタリング
    const { clientId, status, fromDate, toDate, item } = req.query;
    
    let filtered = [...payments];
    
    // クライアントIDでフィルタリング
    if (clientId) {
      filtered = filtered.filter(payment => payment['クライアントID'] === clientId);
    }
    
    // 状態でフィルタリング（未入金/入金済み等）
    if (status) {
      filtered = filtered.filter(payment => payment['状態'] === status);
    }
    
    // 項目でフィルタリング（トライアル/継続等）
    if (item) {
      filtered = filtered.filter(payment => payment['項目'] === item);
    }
    
    // 日付範囲でフィルタリング（登録日）
    if (fromDate || toDate) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment['登録日']);
        
        if (fromDate && toDate) {
          return paymentDate >= new Date(fromDate) && paymentDate <= new Date(toDate);
        } else if (fromDate) {
          return paymentDate >= new Date(fromDate);
        } else if (toDate) {
          return paymentDate <= new Date(toDate);
        }
        
        return true;
      });
    }
    
    // 日付順にソート（新しい順）
    filtered.sort((a, b) => new Date(b['登録日']) - new Date(a['登録日']));
    
    return res.status(200).json(filtered);
  } catch (error) {
    console.error('支払い一覧取得エラー:', error);
    return res.status(500).json({ error: '支払い情報の取得に失敗しました' });
  }
}

/**
 * 新規支払い記録を登録する関数
 */
async function createPayment(req, res) {
  try {
    const data = req.body;
    
    // 必須項目のバリデーション
    if (!data['クライアントID'] || !data['項目'] || !data['金額']) {
      return res.status(400).json({ error: 'クライアントID、項目、金額は必須です' });
    }
    
    // 支払いIDの生成（現在日時 + ランダム文字列）
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    data['支払いID'] = `P${timestamp}${randomStr}`;
    
    // 登録日の設定（現在日付）
    if (!data['登録日']) {
      const today = new Date();
      data['登録日'] = today.toISOString().split('T')[0]; // YYYY-MM-DD形式
    }
    
    // 状態のデフォルト設定
    if (!data['状態']) {
      data['状態'] = '未入金';
    }
    
    // 金額のフォーマットチェック
    const amount = parseInt(data['金額']);
    if (isNaN(amount)) {
      return res.status(400).json({ error: '金額は数値で入力してください' });
    }
    data['金額'] = amount; // 数値型に変換
    
    // スプレッドシートに追加
    await addRow(config.SHEET_NAMES.PAYMENT, data);
    
    return res.status(201).json({ 
      success: true, 
      message: '支払い記録を登録しました',
      paymentId: data['支払いID']
    });
  } catch (error) {
    console.error('支払い登録エラー:', error);
    return res.status(500).json({ error: '支払い登録に失敗しました' });
  }
}