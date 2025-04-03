import { addRow, getSheetData, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';
import { SESSION_STATUS } from '../../../lib/constants';
import { sendEmail, EMAIL_TEMPLATES } from '../../../lib/email';

// セッション登録後のメール送信試行回数
const MAX_EMAIL_RETRY = 3;

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
    
    // 既存クライアントの検索
    let clients = [];
    try {
      clients = await getSheetData(config.SHEET_NAMES.CLIENT);
      logger.info(`既存クライアント検索: ${clients.length}件のクライアントデータをチェック`);
    } catch (err) {
      logger.error('クライアントデータ取得エラー:', err);
      // クライアント取得エラーの場合も処理を継続（新規クライアントとして登録）
    }
    
    // メールアドレスで既存クライアントを検索
    const existingClient = clients.find(client => 
      client.メールアドレス && client.メールアドレス.toLowerCase() === data.メールアドレス.toLowerCase()
    );
    
    // クライアントID（既存or新規）
    let clientId;
    
    if (existingClient) {
      // 既存クライアントの場合
      clientId = existingClient.クライアントID;
      logger.info(`既存クライアント: ${existingClient.お名前}, ID=${clientId}`);
    } else {
      // 新規クライアントの場合
      const timestamp = new Date().getTime();
      const randomStr = Math.random().toString(36).substring(2, 8);
      clientId = `C${timestamp}${randomStr}`;
      
      // クライアント情報の登録
      const clientData = {
        クライアントID: clientId,
        お名前: data.クライアント名,
        メールアドレス: data.メールアドレス,
        電話番号: data.電話番号,
        登録日時: new Date().toISOString(),
        メモ: data.メモ || '',
        ステータス: 'トライアル前'
      };
      
      try {
        logger.info(`新規クライアント登録: ${clientData.お名前}, ID=${clientId}`);
        await addRow(config.SHEET_NAMES.CLIENT, clientData);
      } catch (clientError) {
        logger.error('クライアント登録エラー:', clientError);
        return res.status(500).json({ 
          error: 'クライアント情報の登録に失敗しました', 
          details: clientError.message
        });
      }
    }
    
    // セッションID生成
    const timestamp = new Date().getTime();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const sessionId = `S${timestamp}${randomStr}`;
    
    // GoogleMeet URLの生成（オンラインの場合）
    let meetUrl = '';
    if (data.セッション形式 === 'オンライン') {
      const meetDate = new Date(data.予定日時);
      const formattedDate = meetDate.toISOString().replace(/[^a-zA-Z0-9]/g, '');
      meetUrl = `https://meet.google.com/${formattedDate}-mec-${randomStr}`;
    }
    
    // セッション情報の登録
    const sessionData = {
      セッションID: sessionId,
      クライアントID: clientId,
      クライアント名: data.クライアント名,
      予定日時: data.予定日時,
      セッション種別: data.セッション種別,
      セッション形式: data.セッション形式,
      'Google Meet URL': meetUrl,
      ステータス: SESSION_STATUS.SCHEDULED,
      メモ: data.メモ || '',
      登録日時: new Date().toISOString()
    };
    
    try {
      logger.info(`セッション登録: ID=${sessionId}, クライアントID=${clientId}`);
      await addRow(config.SHEET_NAMES.SESSION, sessionData);
      
      // 予約確認メールを送信（リトライ機能付き）
      try {
        // 日付のフォーマット
        const sessionDate = new Date(data.予定日時);
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const formattedDate = `${sessionDate.getFullYear()}年${sessionDate.getMonth() + 1}月${sessionDate.getDate()}日(${weekdays[sessionDate.getDay()]}) ${sessionDate.getHours()}:${String(sessionDate.getMinutes()).padStart(2, '0')}`;
        
        // セッション種別によってテンプレートを選択
        const isTrialSession = data.セッション種別 === 'トライアル';
        const emailTemplate = isTrialSession ? 
          EMAIL_TEMPLATES.TRIAL_CONFIRMATION : 
          EMAIL_TEMPLATES.CONTINUATION_CONFIRMATION;
        
        // クライアント向けメール送信データ準備
        const clientEmailData = {
          to: data.メールアドレス,
          subject: `【ご予約確定】マインドエンジニアリング・コーチング ${data.セッション種別}`,
          template: emailTemplate,
          data: {
            name: data.クライアント名,
            date: formattedDate,
            format: data.セッション形式 === 'オンライン' ? 'オンライン（Google Meet）' : '対面',
            meetLink: meetUrl || '',
            sessionType: data.セッション種別
          }
        };
        
        // コーチ向けメール（管理者通知）データ準備
        const adminEmail = process.env.EMAIL_SENDER || 'mindengineeringcoaching@gmail.com';
        const adminEmailData = {
          to: adminEmail,
          subject: `【新規予約】${data.クライアント名}様 ${data.セッション種別}`,
          template: 'default',
          data: {
            title: '新規セッション予約がありました',
            name: '森山様',
            message: `
              ${data.クライアント名}様から新しい予約がありました。<br><br>
              <strong>セッション種別:</strong> ${data.セッション種別}<br>
              <strong>日時:</strong> ${formattedDate}<br>
              <strong>形式:</strong> ${data.セッション形式}<br>
              <strong>メールアドレス:</strong> ${data.メールアドレス}<br>
              <strong>電話番号:</strong> ${data.電話番号}<br>
              ${data.メモ ? `<strong>備考:</strong> ${data.メモ}<br>` : ''}
              ${meetUrl ? `<strong>Google Meet URL:</strong> <a href="${meetUrl}">${meetUrl}</a><br>` : ''}
            `
          }
        };
        
        // 並行処理でメール送信
        const emailPromises = [
          sendEmail(clientEmailData).then(() => {
            logger.info(`クライアント向け予約確認メールを送信しました: ${data.メールアドレス}`);
            return { success: true, recipient: 'client' };
          }).catch(err => {
            logger.error(`クライアントメール送信エラー: ${err.message}`);
            return { success: false, recipient: 'client', error: err.message };
          }),
          
          sendEmail(adminEmailData).then(() => {
            logger.info(`コーチ向け予約通知メールを送信しました: ${adminEmail}`);
            return { success: true, recipient: 'admin' };
          }).catch(err => {
            logger.error(`管理者メール送信エラー: ${err.message}`);
            return { success: false, recipient: 'admin', error: err.message };
          })
        ];
        
        // メール送信結果をログに記録するが、API応答は成功として処理を継続
        const emailResults = await Promise.allSettled(emailPromises);
        const emailStatus = emailResults.map(result => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return { success: false, error: result.reason.message };
          }
        });
        
        logger.info(`メール送信結果: ${JSON.stringify(emailStatus)}`);
        
      } catch (emailError) {
        // メール送信エラーはログに記録するが、API応答は成功として返す
        logger.error('予約確認メール送信処理エラー:', emailError);
      }
    } catch (sessionError) {
      logger.error('セッション登録エラー:', sessionError);
      return res.status(500).json({ 
        error: 'セッション情報の登録に失敗しました', 
        details: sessionError.message
      });
    }
    
    // 成功レスポンス
    return res.status(201).json({ 
      success: true, 
      message: 'セッションを予約しました',
      sessionId,
      clientId,
      meetUrl
    });
  } catch (error) {
    logger.error('セッション予約エラー:', error);
    return res.status(500).json({ 
      error: 'セッション予約に失敗しました', 
      details: error.message
    });
  }
}