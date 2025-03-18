import { getSheetData, config, addRow } from '../../../lib/sheets';
import { getSession } from 'next-auth/react';
import logger from '../../../lib/logger';

export default async function handler(req, res) {
  // セッションチェック（開発環境ではコメントアウト可）
  /*
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  */

  // リクエストメソッドに応じた処理分岐
  switch (req.method) {
    case 'GET':
      // セッション一覧を取得
      return await getSessions(req, res);
    case 'POST':
      // 新規セッションを登録
      return await createSession(req, res);
    default:
      return res.status(405).json({ error: 'メソッドが許可されていません' });
  }
}

/**
 * セッション一覧を取得する関数
 */
async function getSessions(req, res) {
  try {
    logger.info('セッション一覧取得API呼び出し開始');
    
    // 先にクライアント情報を取得（セッションとマージするため）
    let clients = [];
    try {
      logger.info(`クライアントデータ取得開始: シート「${config.SHEET_NAMES.CLIENT}」`);
      clients = await getSheetData(config.SHEET_NAMES.CLIENT);
      logger.info(`クライアントデータ取得成功: ${clients.length}件`);
    } catch (sheetError) {
      logger.error('クライアントデータ取得エラー:', sheetError);
      // クライアント取得失敗してもセッションは取得を試みる
    }
    
    // クライアントIDから名前への変換マップを作成
    const clientMap = {};
    clients.forEach(client => {
      if (client.クライアントID && client.お名前) {
        clientMap[client.クライアントID] = client.お名前;
      }
    });
    
    // セッションデータを取得
    let sessions = [];
    try {
      logger.info(`セッションデータ取得開始: シート「${config.SHEET_NAMES.SESSION}」`);
      sessions = await getSheetData(config.SHEET_NAMES.SESSION);
      logger.info(`セッションデータ取得成功: ${sessions.length}件`);
    } catch (sheetError) {
      logger.error('セッションデータ取得エラー:', sheetError);
      return res.status(500).json({ 
        error: 'スプレッドシートからのデータ取得に失敗しました', 
        details: sheetError.message
      });
    }
    
    // フィルタリング
    const { clientId, status, from, to } = req.query;
    
    let filtered = [...sessions];
    
    // クライアントIDでフィルタリング
    if (clientId) {
      logger.debug(`クライアントIDでフィルタリング: ${clientId}`);
      filtered = filtered.filter(session => session.クライアントID === clientId);
    }
    
    // ステータスでフィルタリング
    if (status) {
      logger.debug(`ステータスでフィルタリング: ${status}`);
      filtered = filtered.filter(session => session.ステータス === status);
    }
    
    // 日付範囲でフィルタリング
    if (from || to) {
      logger.debug(`日付範囲でフィルタリング: from=${from}, to=${to}`);
      filtered = filtered.filter(session => {
        if (!session.予定日時) return false;
        
        const sessionDate = new Date(session.予定日時);
        if (isNaN(sessionDate.getTime())) return false;
        
        if (from && to) {
          return sessionDate >= new Date(from) && sessionDate <= new Date(to);
        } else if (from) {
          return sessionDate >= new Date(from);
        } else if (to) {
          return sessionDate <= new Date(to);
        }
        
        return true;
      });
    }
    
    // 日付順にソート（新しい順）
    filtered.sort((a, b) => {
      if (!a.予定日時) return 1;
      if (!b.予定日時) return -1;
      return new Date(a.予定日時) - new Date(b.予定日時);
    });
    
    // クライアント名を追加
    filtered = filtered.map(session => ({
      ...session,
      クライアント名: session.クライアントID ? clientMap[session.クライアントID] || '不明' : '不明'
    }));
    
    logger.info(`セッション一覧取得API完了: ${filtered.length}件のデータを返します`);
    return res.status(200).json(filtered);
  } catch (error) {
    logger.error('セッション一覧取得エラー:', error);
    return res.status(500).json({ 
      error: 'セッション情報の取得に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * 新規セッションを登録する関数
 */
async function createSession(req, res) {
  try {
    logger.info('セッション登録API呼び出し開始');
    const data = req.body;
    
    // 必須項目のバリデーション
    if (!data.クライアントID || !data.予定日時 || !data.セッション種別) {
      return res.status(400).json({ error: 'クライアントID、予定日時、セッション種別は必須です' });
    }
    
    // 日時のフォーマットチェック
    if (isNaN(new Date(data.予定日時).getTime())) {
      return res.status(400).json({ error: '予定日時の形式が正しくありません' });
    }
    
    // セッションIDの生成（現在日時 + ランダム文字列）
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    data.セッションID = `S${timestamp}${randomStr}`;
    
    // GoogleMeet URLの生成（実際には別のAPIで生成することが多いですが、ここではシンプルな例）
    const meetDate = new Date(data.予定日時);
    const formattedDate = meetDate.toISOString().replace(/[^\\w]/g, '');
    data['Google Meet URL'] = `https://meet.google.com/${formattedDate}-mec-${randomStr}`;
    
    // ステータスの初期設定（予定）
    if (!data.ステータス) {
      data.ステータス = '予定';
    }
    
    // 登録日時の設定
    data.登録日時 = new Date().toISOString();
    
    // スプレッドシートに追加
    await addRow(config.SHEET_NAMES.SESSION, data);
    
    logger.info(`セッション登録成功: ID=${data.セッションID}`);
    return res.status(201).json({ 
      success: true, 
      message: 'セッションを登録しました',
      sessionId: data.セッションID,
      meetUrl: data['Google Meet URL']
    });
  } catch (error) {
    logger.error('セッション登録エラー:', error);
    return res.status(500).json({ 
      error: 'セッション登録に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}