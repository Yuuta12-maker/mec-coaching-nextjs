import { findRowById, config } from '../../../lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // リクエストメソッドチェック
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  try {
    // 認証チェック
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // URLからクライアントIDを取得
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'クライアントIDが必要です' });
    }

    // IDに対応するクライアント情報を取得
    const client = await findRowById(config.SHEET_NAMES.CLIENT, id, 'クライアントID');
    if (!client) {
      return res.status(404).json({ error: 'クライアントが見つかりません' });
    }

    // クライアントに関連するセッション情報も取得（オプション）
    /* 
    // 関連セッションを取得する場合は以下のコードを利用
    const allSessions = await getSheetData(config.SHEET_NAMES.SESSION);
    const clientSessions = allSessions.filter(session => 
      session.クライアントID === id
    );
    */

    return res.status(200).json({ client });
  } catch (error) {
    console.error('クライアント詳細取得エラー:', error);
    return res.status(500).json({ error: 'クライアントの詳細取得に失敗しました', details: error.message });
  }
}