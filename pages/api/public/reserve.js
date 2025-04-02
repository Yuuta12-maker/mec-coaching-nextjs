import { addRow, getSheetData, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';
import { SESSION_STATUS } from '../../../lib/constants';

export default async function handler(req, res) {
  // 公開APIなのでセッションチェックはスキップ
  
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  try {
    logger.info('セッション予約API呼び出し');
    const data = req.body;
    
    // 必須項目のバリデーション
    if (!data.クライアント名 || !data.メールアドレス || !data.電話番号 || !data.予定日時 || !data.セッション種別 || !data.セッション形式) {
      return res.status(400).json({ error: '必須項目が入力されていません' });
    }
    
    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.メールアドレス)) {
      return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
    }
    
    // 日時のフォーマットチェック
    if (isNaN(new Date(data.予定日時).getTime())) {
      return res.status(400).json({ error: '予定日時の形式が正しくありません' });
    }
    
    // 既存クライアントの検索
    let clients = [];
    try {
      clients = await getSheetData(config.SHEET_NAMES.CLIENT);
      logger.info(`既存クライアント検索: ${clients.length}件のクライアントデータをチェック`);
    } catch (err) {
      logger.error('クライアントデータ取得エラー:', err);
      // クライアント取得エラーの場合も処理を継続（新規クライアントとして登録）
    }
    
    // メールアドレスで既存クライアントを検索
    const existingClient = clients.find(client => 
      client.メールアドレス && client.メールアドレス.toLowerCase() === data.メールアドレス.toLowerCase()
    );
    
    // クライアントID（既存or新規）
    let clientId;
    
    if (existingClient) {
      // 既存クライアントの場合
      clientId = existingClient.クライアントID;
      logger.info(`既存クライアント: ${existingClient.お名前}, ID=${clientId}`);
    } else {
      // 新規クライアントの場合
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8);
      clientId = `C${timestamp}${randomStr}`;
      
      // クライアント情報の登録
      const clientData = {
        クライアントID: clientId,
        お名前: data.クライアント名,
        メールアドレス: data.メールアドレス,
        電話番号: data.電話番号,
        登録日時: new Date().toISOString(),
        メモ: data.メモ || '',
        ステータス: 'トライアル前'
      };
      
      try {
        logger.info(`新規クライアント登録: ${clientData.お名前}, ID=${clientId}`);
        await addRow(config.SHEET_NAMES.CLIENT, clientData);
      } catch (clientError) {
        logger.error('クライアント登録エラー:', clientError);
        return res.status(500).json({ 
          error: 'クライアント情報の登録に失敗しました', 
          details: clientError.message
        });
      }
    }
    
    // セッションID生成
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const sessionId = `S${timestamp}${randomStr}`;
    
    // GoogleMeet URLの生成（オンラインの場合）
    let meetUrl = '';
    if (data.セッション形式 === 'オンライン') {
      const meetDate = new Date(data.予定日時);
      const formattedDate = meetDate.toISOString().replace(/[^a-zA-Z0-9]/g, '');
      meetUrl = `https://meet.google.com/${formattedDate}-mec-${randomStr}`;
    }
    
    // セッション情報の登録
    const sessionData = {
      セッションID: sessionId,
      クライアントID: clientId,
      クライアント名: data.クライアント名,
      予定日時: data.予定日時,
      セッション種別: data.セッション種別,
      セッション形式: data.セッション形式,
      'Google Meet URL': meetUrl,
      ステータス: SESSION_STATUS.SCHEDULED,
      メモ: data.メモ || '',
      登録日時: new Date().toISOString()
    };
    
    try {
      logger.info(`セッション登録: ID=${sessionId}, クライアントID=${clientId}`);
      await addRow(config.SHEET_NAMES.SESSION, sessionData);
    } catch (sessionError) {
      logger.error('セッション登録エラー:', sessionError);
      return res.status(500).json({ 
        error: 'セッション情報の登録に失敗しました', 
        details: sessionError.message
      });
    }
    
    // 成功レスポンス
    return res.status(201).json({ 
      success: true, 
      message: 'セッションを予約しました',
      sessionId,
      clientId,
      meetUrl
    });
  } catch (error) {
    logger.error('セッション予約エラー:', error);
    return res.status(500).json({ 
      error: 'セッション予約に失敗しました', 
      details: error.message
    });
  }
}