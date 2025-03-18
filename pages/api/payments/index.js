import { getSheetData, addRow, config, testConnection } from '../../../lib/sheets';
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
    logger.info('支払い一覧取得API呼び出し開始');
    
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
    
    // 支払いシートの存在確認
    const sheetName = config.SHEET_NAMES.PAYMENT;
    if (!sheetName) {
      logger.error('支払いシート名が設定されていません');
      return res.status(500).json({ 
        error: '支払いシート名が設定されていません',
        sheetConfig: config.SHEET_NAMES
      });
    }
    
    // スプレッドシートから支払いデータを取得
    logger.info(`支払いデータ取得開始: シート「${sheetName}」`);
    let payments = [];
    try {
      payments = await getSheetData(sheetName);
      logger.info(`支払いデータ取得成功: ${payments.length}件`);
    } catch (sheetError) {
      logger.error('スプレッドシート取得エラーの詳細:', sheetError);
      return res.status(500).json({ 
        error: 'スプレッドシートからのデータ取得に失敗しました', 
        details: sheetError.message,
        stack: process.env.NODE_ENV === 'development' ? sheetError.stack : undefined
      });
    }
    
    // フィルタリング
    const { clientId, status, fromDate, toDate, item } = req.query;
    
    let filtered = [...payments];
    
    // クライアントIDでフィルタリング
    if (clientId) {
      logger.debug(`クライアントIDでフィルタリング: ${clientId}`);
      filtered = filtered.filter(payment => payment['クライアントID'] === clientId);
    }
    
    // 状態でフィルタリング（未入金/入金済み等）
    if (status) {
      logger.debug(`状態でフィルタリング: ${status}`);
      filtered = filtered.filter(payment => payment['状態'] === status);
    }
    
    // 項目でフィルタリング（トライアル/継続等）
    if (item) {
      logger.debug(`項目でフィルタリング: ${item}`);
      filtered = filtered.filter(payment => payment['項目'] === item);
    }
    
    // 日付範囲でフィルタリング（登録日）
    if (fromDate || toDate) {
      logger.debug(`日付範囲でフィルタリング: from=${fromDate}, to=${toDate}`);
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
    filtered.sort((a, b) => {
      if (!a['登録日']) return 1;
      if (!b['登録日']) return -1;
      return new Date(b['登録日']) - new Date(a['登録日']);
    });
    
    // クライアント名の追加（可能な場合）
    try {
      // クライアント情報を取得
      const clients = await getSheetData(config.SHEET_NAMES.CLIENT);
      
      // クライアントIDから名前へのマッピングを作成
      const clientMap = {};
      clients.forEach(client => {
        if (client['クライアントID'] && client['お名前']) {
          clientMap[client['クライアントID']] = client['お名前'];
        }
      });
      
      // 支払いデータにクライアント名を追加
      filtered = filtered.map(payment => {
        const clientName = payment['クライアントID'] ? 
          clientMap[payment['クライアントID']] || '不明' : '不明';
        
        return {
          ...payment,
          クライアント名: clientName
        };
      });
    } catch (clientError) {
      logger.warn('クライアント情報取得エラー:', clientError);
      // クライアント情報の取得に失敗しても支払い情報は返す
    }
    
    logger.info(`支払い一覧取得API完了: ${filtered.length}件のデータを返します`);
    return res.status(200).json(filtered);
  } catch (error) {
    logger.error('支払い一覧取得エラー:', error);
    return res.status(500).json({ 
      error: '支払い情報の取得に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * 新規支払い記録を登録する関数
 */
async function createPayment(req, res) {
  try {
    logger.info('支払い登録API呼び出し開始');
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
    logger.info(`支払い情報をスプレッドシートに追加: ${JSON.stringify(data)}`);
    const result = await addRow(config.SHEET_NAMES.PAYMENT, data);
    logger.info('支払い情報追加成功:', result);
    
    return res.status(201).json({ 
      success: true, 
      message: '支払い記録を登録しました',
      paymentId: data['支払いID']
    });
  } catch (error) {
    logger.error('支払い登録エラー:', error);
    return res.status(500).json({ 
      error: '支払い登録に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
