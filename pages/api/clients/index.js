import { getSheetData, config } from '../../../lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // リクエストメソッドチェック
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  try {
    // 認証チェック - 一時的にコメントアウト（開発中のテスト用）
    /*
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: '認証が必要です' });
    }
    */

    // クエリパラメータを取得 (フィルタリング用)
    const { status, search } = req.query;

    console.log('スプレッドシートデータ取得を開始...');
    
    // スプレッドシートからクライアントデータを取得
    let clients = [];
    try {
      clients = await getSheetData(config.SHEET_NAMES.CLIENT);
      console.log(`クライアントデータ取得成功: ${clients.length}件`);
    } catch (sheetError) {
      console.error('スプレッドシート取得エラー:', sheetError);
      return res.status(500).json({ 
        error: 'スプレッドシートからのデータ取得に失敗しました', 
        details: sheetError.message,
        stack: process.env.NODE_ENV === 'development' ? sheetError.stack : undefined
      });
    }

    // ステータスでフィルタリング
    if (status) {
      clients = clients.filter(client => client.ステータス === status);
    }

    // 検索キーワードでフィルタリング
    if (search) {
      const searchLower = search.toLowerCase();
      clients = clients.filter(client => 
        (client.お名前 && client.お名前.toLowerCase().includes(searchLower)) ||
        (client['お名前　（カナ）'] && client['お名前　（カナ）'].toLowerCase().includes(searchLower)) ||
        (client.メールアドレス && client.メールアドレス.toLowerCase().includes(searchLower))
      );
    }

    // 個人情報の一部を隠蔽（APIレスポンスで全データを返さない）
    const safeClients = clients.map(client => ({
      クライアントID: client.クライアントID || `C${Date.now()}`, // IDがない場合は仮のIDを生成
      お名前: client.お名前 || '名前なし',
      'お名前　（カナ）': client['お名前　（カナ）'] || '',
      ステータス: client.ステータス || '未設定',
      メールアドレス: client.メールアドレス || '',
      タイムスタンプ: client.タイムスタンプ || '',
      希望セッション形式: client.希望セッション形式 || '',
    }));

    return res.status(200).json({ clients: safeClients });
  } catch (error) {
    console.error('クライアント一覧取得エラー:', error);
    return res.status(500).json({ 
      error: 'クライアントの取得に失敗しました', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}