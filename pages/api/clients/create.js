import { addRow, config } from '../../../lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '許可されていないメソッドです' });
  }

  try {
    // 認証チェック
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // リクエストボディからクライアント情報を取得
    const clientData = req.body;
    
    // 必須項目のバリデーション
    if (!clientData.お名前 || !clientData.メールアドレス) {
      return res.status(400).json({ error: '名前とメールアドレスは必須です' });
    }

    // クライアントIDと登録日時を自動生成
    const timestamp = new Date().toISOString();
    const clientId = 'C' + Date.now().toString();
    
    // 登録用データを作成
    const newClient = {
      クライアントID: clientId,
      タイムスタンプ: timestamp,
      メールアドレス: clientData.メールアドレス,
      お名前: clientData.お名前,
      'お名前　（カナ）': clientData['お名前　（カナ）'] || '',
      性別: clientData.性別 || '',
      生年月日: clientData.生年月日 || '',
      '電話番号　（ハイフンなし）': clientData['電話番号　（ハイフンなし）'] || '',
      ご住所: clientData.ご住所 || '',
      希望セッション形式: clientData.希望セッション形式 || '',
      備考欄: clientData.備考欄 || '',
      ステータス: clientData.ステータス || '問合せ'
    };

    // スプレッドシートに追加
    await addRow(config.SHEET_NAMES.CLIENT, newClient);

    return res.status(201).json({ 
      success: true, 
      message: 'クライアントを登録しました', 
      client: { クライアントID: clientId, ...clientData } 
    });
  } catch (error) {
    console.error('クライアント登録エラー:', error);
    return res.status(500).json({ error: 'クライアントの登録に失敗しました', details: error.message });
  }
}