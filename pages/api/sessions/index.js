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
    const sessions = await getSheetData(config.SHEET_NAMES.SESSION);
    
    // フィルタリング
    const { clientId, status, from, to } = req.query;
    
    let filtered = [...sessions];
    
    // クライアントIDでフィルタリング
    if (clientId) {
      filtered = filtered.filter(session => session['クライアントID'] === clientId);
    }
    
    // ステータスでフィルタリング
    if (status) {
      filtered = filtered.filter(session => session['ステータス'] === status);
    }
    
    // 日付範囲でフィルタリング
    if (from || to) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session['予定日時']);
        
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
    
    // 日付順にソート
    filtered.sort((a, b) => new Date(a['予定日時']) - new Date(b['予定日時']));
    
    return res.status(200).json(filtered);
  } catch (error) {
    console.error('セッション一覧取得エラー:', error);
    return res.status(500).json({ error: 'セッション情報の取得に失敗しました' });
  }
}

/**
 * 新規セッションを登録する関数
 */
async function createSession(req, res) {
  try {
    const data = req.body;
    
    // 必須項目のバリデーション
    if (!data['クライアントID'] || !data['予定日時'] || !data['セッション種別']) {
      return res.status(400).json({ error: 'クライアントID、予定日時、セッション種別は必須です' });
    }
    
    // 日時のフォーマットチェック
    if (isNaN(new Date(data['予定日時']).getTime())) {
      return res.status(400).json({ error: '予定日時の形式が正しくありません' });
    }
    
    // セッションIDの生成（現在日時 + ランダム文字列）
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    data['セッションID'] = `S${timestamp}${randomStr}`;
    
    // GoogleMeet URLの生成（実際には別のAPIで生成することが多いですが、ここではシンプルな例）
    const meetDate = new Date(data['予定日時']);
    const formattedDate = meetDate.toISOString().replace(/[^\w]/g, '');
    data['Google Meet URL'] = `https://meet.google.com/${formattedDate}-mec-${randomStr}`;
    
    // ステータスの初期設定（予定）
    if (!data['ステータス']) {
      data['ステータス'] = '予定';
    }
    
    // 登録日時の設定
    data['登録日時'] = new Date().toISOString();
    
    // スプレッドシートに追加
    await addRow(config.SHEET_NAMES.SESSION, data);
    
    return res.status(201).json({ 
      success: true, 
      message: 'セッションを登録しました',
      sessionId: data['セッションID'],
      meetUrl: data['Google Meet URL']
    });
  } catch (error) {
    console.error('セッション登録エラー:', error);
    return res.status(500).json({ error: 'セッション登録に失敗しました' });
  }
}