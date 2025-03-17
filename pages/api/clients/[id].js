import { findRowById, updateRowById, config } from '../../../lib/sheets';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // セッションチェック（認証済みかどうか）
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  // クライアントIDを取得
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'クライアントIDが必要です' });
  }

  // リクエストメソッドに応じた処理分岐
  switch (req.method) {
    case 'GET':
      // 特定のクライアント情報を取得
      return await getClient(req, res, id);
    case 'PUT':
      // クライアント情報を更新
      return await updateClient(req, res, id);
    case 'DELETE':
      // クライアント情報を削除（実装する場合）
      return res.status(501).json({ error: '削除機能は現在準備中です' });
    default:
      return res.status(405).json({ error: 'メソッドが許可されていません' });
  }
}

/**
 * 特定のクライアント情報を取得する関数
 */
async function getClient(req, res, id) {
  try {
    const client = await findRowById(config.SHEET_NAMES.CLIENT, id, 'クライアントID');
    
    if (!client) {
      return res.status(404).json({ error: '指定されたクライアントが見つかりません' });
    }
    
    return res.status(200).json(client);
  } catch (error) {
    console.error('クライアント情報取得エラー:', error);
    return res.status(500).json({ error: 'クライアント情報の取得に失敗しました' });
  }
}

/**
 * クライアント情報を更新する関数
 */
async function updateClient(req, res, id) {
  try {
    const data = req.body;
    
    // 必須項目のバリデーション
    if (!data['お名前'] || !data['メールアドレス']) {
      return res.status(400).json({ error: '名前とメールアドレスは必須です' });
    }
    
    // クライアントが存在するか確認
    const existingClient = await findRowById(config.SHEET_NAMES.CLIENT, id, 'クライアントID');
    if (!existingClient) {
      return res.status(404).json({ error: '指定されたクライアントが見つかりません' });
    }
    
    // 更新不可のフィールドを除外
    const updateData = { ...data };
    delete updateData['クライアントID']; // IDは更新不可
    delete updateData['タイムスタンプ']; // 登録日時は更新不可
    
    // 最終更新日時を追加（必要であれば）
    updateData['最終更新日時'] = new Date().toISOString();
    
    // スプレッドシートを更新
    await updateRowById(config.SHEET_NAMES.CLIENT, id, updateData, 'クライアントID');
    
    return res.status(200).json({ 
      success: true, 
      message: 'クライアント情報を更新しました',
      clientId: id
    });
  } catch (error) {
    console.error('クライアント更新エラー:', error);
    return res.status(500).json({ error: 'クライアント情報の更新に失敗しました' });
  }
}