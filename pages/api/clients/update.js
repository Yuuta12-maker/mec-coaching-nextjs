import { updateRowById, config } from '../../../lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // PUTメソッドのみ許可
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  try {
    // 認証チェック
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // リクエストボディからクライアント情報を取得
    const { クライアントID, ...clientData } = req.body;
    
    // クライアントIDのバリデーション
    if (!クライアントID) {
      return res.status(400).json({ error: 'クライアントIDは必須です' });
    }
    
    // 更新不可フィールド（あれば）を除外
    const { タイムスタンプ, ...updatableData } = clientData;
    
    // クライアント情報を更新
    const result = await updateRowById(
      config.SHEET_NAMES.CLIENT, 
      クライアントID, 
      updatableData, 
      'クライアントID'
    );
    
    return res.status(200).json({ 
      success: true, 
      message: 'クライアント情報を更新しました', 
      result 
    });
  } catch (error) {
    console.error('クライアント更新エラー:', error);
    return res.status(500).json({ error: 'クライアント情報の更新に失敗しました', details: error.message });
  }
}