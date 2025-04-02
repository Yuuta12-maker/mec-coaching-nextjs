import { addRow, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';
import { SESSION_STATUS } from '../../../lib/constants';
import { sendMail } from '../../../lib/email'; // メール送信機能（必要に応じて実装）

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
    
    // セッションIDの生成（現在日時 + ランダム文字列）
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    data.セッションID = `S${timestamp}${randomStr}`;
    
    // クライアントIDの生成（まだクライアントが登録されていない場合）
    const clientId = `C${timestamp}${randomStr}`;
    
    // GoogleMeet URLの生成
    if (data.セッション形式 === 'オンライン') {
      const meetDate = new Date(data.予定日時);
      const formattedDate = meetDate.toISOString().replace(/[^a-zA-Z0-9]/g, '');
      data['Google Meet URL'] = `https://meet.google.com/${formattedDate}-mec-${randomStr}`;
    } else {
      data['Google Meet URL'] = '';
    }
    
    // ステータスの設定
    if (!data.ステータス) {
      data.ステータス = SESSION_STATUS.SCHEDULED;
    }
    
    // 登録日時の設定
    data.登録日時 = new Date().toISOString();
    
    // クライアント情報の追加（既存クライアントがいなければ新規作成）
    let clientData = {
      クライアントID: clientId,
      お名前: data.クライアント名,
      メールアドレス: data.メールアドレス,
      電話番号: data.電話番号,
      登録日時: data.登録日時,
      メモ: data.メモ || '',
      ステータス: 'トライアル前'
    };
    
    // セッション登録情報を整形
    const sessionData = {
      セッションID: data.セッションID,
      クライアントID: clientId,  // 仮のクライアントID（実際にはクライアント検索して既存の場合は既存のIDを使う）
      クライアント名: data.クライアント名,
      予定日時: data.予定日時,
      セッション種別: data.セッション種別,
      セッション形式: data.セッション形式,
      'Google Meet URL': data['Google Meet URL'],
      ステータス: data.ステータス,
      メモ: data.メモ || '',
      登録日時: data.登録日時
    };
    
    // クライアント登録（実際の実装では既存クライアントチェックなど行う）
    try {
      logger.info(`新規クライアント登録: ${clientData.お名前}`);
      await addRow(config.SHEET_NAMES.CLIENT, clientData);
    } catch (clientError) {
      logger.error('クライアント登録エラー:', clientError);
      return res.status(500).json({ 
        error: 'クライアント情報の登録に失敗しました', 
        details: clientError.message
      });
    }
    
    // セッション登録
    try {
      logger.info(`新規セッション登録: ID=${sessionData.セッションID}`);
      await addRow(config.SHEET_NAMES.SESSION, sessionData);
    } catch (sessionError) {
      logger.error('セッション登録エラー:', sessionError);
      return res.status(500).json({ 
        error: 'セッション情報の登録に失敗しました', 
        details: sessionError.message
      });
    }
    
    // 確認メールの送信（実際の実装ではメール送信機能を追加）
    try {
      logger.info(`確認メール送信: ${data.メールアドレス}`);
      // 実際のメール送信コードはここに実装
      /*
      await sendMail({
        to: data.メールアドレス,
        subject: 'マインドエンジニアリング・コーチング セッション予約確認',
        html: `
          <p>${data.クライアント名} 様</p>
          <p>マインドエンジニアリング・コーチングのセッションをご予約いただき、ありがとうございます。</p>
          <p>以下の内容で予約を承りました。</p>
          <ul>
            <li>日時: ${new Date(data.予定日時).toLocaleString('ja-JP', { dateStyle: 'full', timeStyle: 'short' })}</li>
            <li>セッション種別: ${data.セッション種別}</li>
            <li>セッション形式: ${data.セッション形式}</li>
            ${data['Google Meet URL'] ? `<li>Google Meet URL: ${data['Google Meet URL']}</li>` : ''}
          </ul>
          <p>当日のセッションをお待ちしております。</p>
        `
      });
      */
    } catch (emailError) {
      logger.error('確認メール送信エラー:', emailError);
      // メール送信失敗はエラーとしない（予約自体は成功）
    }
    
    // 成功レスポンス
    return res.status(201).json({ 
      success: true, 
      message: 'セッションを予約しました',
      sessionId: data.セッションID,
      clientId: clientId,
      meetUrl: data['Google Meet URL'] || null
    });
  } catch (error) {
    logger.error('セッション予約エラー:', error);
    return res.status(500).json({ 
      error: 'セッション予約に失敗しました', 
      details: error.message
    });
  }
}