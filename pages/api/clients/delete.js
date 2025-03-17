import { findRowById, updateRowById, config } from '../../../lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // DELETEメソッドのみ許可
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  try {
    // 認証チェック
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // リクエストボディからクライアントIDを取得
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'クライアントIDは必須です' });
    }
    
    // クライアントが存在するか確認
    const client = await findRowById(config.SHEET_NAMES.CLIENT, id, 'クライアントID');
    if (!client) {
      return res.status(404).json({ error: 'クライアントが見つかりません' });
    }
    
    // 実際に行を削除するのではなく、ステータスを「削除済み」に更新
    // GASで行を物理的に削除する実装も可能ですが、データを残しておく方が安全です
    const result = await updateRowById(
      config.SHEET_NAMES.CLIENT, 
      id, 
      { ステータス: '削除済み' }, 
      'クライアントID'
    );
    
    return res.status(200).json({ 
      success: true, 
      message: 'クライアントを削除しました',
      result
    });
  } catch (error) {
    console.error('クライアント削除エラー:', error);
    return res.status(500).json({ error: 'クライアントの削除に失敗しました', details: error.message });
  }
}