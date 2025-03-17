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
      // クライアント一覧を取得
      return await getClients(req, res);
    case 'POST':
      // 新規クライアントを登録
      return await createClient(req, res);
    default:
      return res.status(405).json({ error: 'メソッドが許可されていません' });
  }
}

/**
 * クライアント一覧を取得する関数
 */
async function getClients(req, res) {
  try {
    const clients = await getSheetData(config.SHEET_NAMES.CLIENT);
    
    // 検索クエリがある場合はフィルタリング
    const { search } = req.query;
    if (search) {
      const searchLower = search.toLowerCase();
      const filtered = clients.filter(client => {
        // 名前、メール、IDなどで検索
        return (
          (client['お名前'] || '').toLowerCase().includes(searchLower) ||
          (client['メールアドレス'] || '').toLowerCase().includes(searchLower) ||
          (client['クライアントID'] || '').toLowerCase().includes(searchLower)
        );
      });
      return res.status(200).json(filtered);
    }
    
    return res.status(200).json(clients);
  } catch (error) {
    console.error('クライアント一覧取得エラー:', error);
    return res.status(500).json({ error: 'クライアント情報の取得に失敗しました' });
  }
}

/**
 * 新規クライアントを登録する関数
 */
async function createClient(req, res) {
  try {
    const data = req.body;
    
    // 必須項目のバリデーション
    if (!data['お名前'] || !data['メールアドレス']) {
      return res.status(400).json({ error: '名前とメールアドレスは必須です' });
    }
    
    // クライアントIDの生成（現在日時 + ランダム文字列）
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    data['クライアントID'] = `C${timestamp}${randomStr}`;
    
    // タイムスタンプの追加
    data['タイムスタンプ'] = new Date().toISOString();
    
    // スプレッドシートに追加
    await addRow(config.SHEET_NAMES.CLIENT, data);
    
    return res.status(201).json({ 
      success: true, 
      message: 'クライアントを登録しました',
      clientId: data['クライアントID']
    });
  } catch (error) {
    console.error('クライアント登録エラー:', error);
    return res.status(500).json({ error: 'クライアント登録に失敗しました' });
  }
}