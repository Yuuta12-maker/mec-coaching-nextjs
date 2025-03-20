/**
 * このAPIはテスト用のサンプルクライアントデータを作成するためのものです
 * 本番環境では削除してください
 */

import { withApiMiddleware } from '../../../lib/api-middleware';
import { addRow } from '../../../lib/sheets';
import { DB_TABLES, CLIENT_STATUS } from '../../../lib/api-config';
import { v4 as uuidv4 } from 'uuid';

async function handler(req, res) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'テスト用APIは本番環境では使用できません' });
    }

    // 現在の日付
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // サンプルクライアントID
    const clientId = 'test-client-1';

    // サンプルクライアントデータ
    const sampleClient = {
      クライアントID: clientId,
      タイムスタンプ: today.toISOString(),
      メールアドレス: 'test@example.com',
      お名前: 'テストクライアント',
      お名前_カナ: 'テストクライアント',
      性別: '男性',
      生年月日: '1990-01-01',
      電話番号_ハイフンなし: '0312345678',
      ご住所: '東京都渋谷区',
      希望セッション形式: 'オンライン',
      ステータス: CLIENT_STATUS.TRIAL_AFTER,
      備考欄: 'テスト用クライアントデータ'
    };

    // スプレッドシートに追加
    const result = await addRow(DB_TABLES.CLIENT, sampleClient);

    return res.status(200).json({
      success: true,
      message: 'サンプルクライアントデータを作成しました',
      client: sampleClient
    });

  } catch (error) {
    console.error('サンプルクライアントデータ作成エラー:', error);
    return res.status(500).json({
      error: 'サンプルクライアントデータの作成に失敗しました',
      message: error.message
    });
  }
}

export default withApiMiddleware(handler);