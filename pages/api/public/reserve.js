import { addRow, getSheetData, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';
import { SESSION_STATUS } from '../../../lib/constants';
import { sendEmail, EMAIL_TEMPLATES } from '../../../lib/email';
import { addCalendarEvent } from '../../../lib/google-calendar';
import nodemailer from 'nodemailer';

// セッション登録後のメール送信試行回数
const MAX_EMAIL_RETRY = 3;

// 簡易的なメールテンプレートを直接レンダリングする関数
async function renderEmailTemplate(templateName, data) {
  // 基本的なスタイル
  const baseStyles = `
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #ffffff;
    }
    .header {
      background-color: #c50502;
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 6px 6px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 30px 25px;
    }
    .footer {
      background-color: #f8f8f8;
      padding: 20px 15px;
      text-align: center;
      font-size: 12px;
      color: #666;
      border-radius: 0 0 6px 6px;
      border-top: 1px solid #eaeaea;
    }
    .session-info {
      background-color: #fff9f9;
      border: 1px solid #ffefef;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
    }
    .session-info p {
      margin: 5px 0;
    }
  `;
  
  let template = '';
  const { name = 'お客様', date = '(日時情報なし)', format = 'オンライン', meetLink = '', sessionType = 'セッション' } = data;
  
  // トライアル確認メール
  if (templateName === 'trial-confirmation') {
    template = `
      <div class="container">
        <div class="header">
          <h1>トライアルセッション予約確定</h1>
        </div>
        <div class="content">
          <p>${name}様</p>
          <p>マインドエンジニアリング・コーチング トライアルセッションのご予約ありがとうございます。</p>
          <p>以下の日程でセッションを実施いたします：</p>
          
          <div class="session-info">
            <p><strong>■ 日時：</strong>${date}</p>
            <p><strong>■ 形式：</strong>${format}</p>
            ${meetLink ? `<p><strong>■ Google Meet URL：</strong><a href="${meetLink}">${meetLink}</a></p><p>（セッション開始時刻になりましたら、上記URLをクリックしてご参加ください）</p>` : ''}
          </div>
          
          <p>当日は、リラックスした状態でご参加ください。特別な準備は必要ありません。</p>
          <p>何かご質問がございましたら、お気軽にご連絡ください。</p>
          <p>セッションでお会いできることを楽しみにしております。</p>
          
          <p>森山雄太<br>マインドエンジニアリング・コーチング<br>
          Email: mindengineeringcoaching@gmail.com<br>
          Tel: 090-5710-7627</p>
        </div>
        <div class="footer">
          <p>© マインドエンジニアリング・コーチング</p>
        </div>
      </div>
    `;
  } 
  // 継続セッション確認メール
  else if (templateName === 'continuation-confirmation') {
    template = `
      <div class="container">
        <div class="header">
          <h1>継続セッション予約確定</h1>
        </div>
        <div class="content">
          <p>${name}様</p>
          <p>マインドエンジニアリング・コーチング ${sessionType}のご予約ありがとうございます。</p>
          <p>以下の日程でセッションを実施いたします：</p>
          
          <div class="session-info">
            <p><strong>■ 日時：</strong>${date}</p>
            <p><strong>■ 形式：</strong>${format}</p>
            ${meetLink ? `<p><strong>■ Google Meet URL：</strong><a href="${meetLink}">${meetLink}</a></p><p>（セッション開始時刻になりましたら、上記URLをクリックしてご参加ください）</p>` : ''}
          </div>
          
          <p>セッション当日になりましたら、リラックスした状態でご参加ください。</p>
          <p>何かご質問がございましたら、お気軽にご連絡ください。</p>
          <p>セッションでお会いできることを楽しみにしております。</p>
          
          <p>森山雄太<br>マインドエンジニアリング・コーチング<br>
          Email: mindengineeringcoaching@gmail.com<br>
          Tel: 090-5710-7627</p>
        </div>
        <div class="footer">
          <p>© マインドエンジニアリング・コーチング</p>
        </div>
      </div>
    `;
  }
  // デフォルトテンプレート
  else {
    const { title = 'お知らせ', message = 'マインドエンジニアリング・コーチングからのお知らせです。' } = data;
    template = `
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p>${name}様</p>
          <p>${message}</p>
          <p>何かご質問がございましたら、お気軽にご連絡ください。</p>
          <p>森山雄太<br>マインドエンジニアリング・コーチング</p>
        </div>
        <div class="footer">
          <p>© マインドエンジニアリング・コーチング</p>
        </div>
      </div>
    `;
  }
  
  // スタイルとテンプレートを組み合わせてHTML作成
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>マインドエンジニアリング・コーチング</title>
      <style>
        ${baseStyles}
      </style>
    </head>
    <body>
      ${template}
    </body>
    </html>
  `;
  
  return html;
}

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
    let calendarEventId = '';
    const useGoogleCalendar = process.env.ENABLE_GOOGLE_CALENDAR === 'true';
    
    if (data.セッション形式 === 'オンライン') {
      // Google Calendar統合が有効な場合はカレンダーイベントを作成
      if (useGoogleCalendar) {
        try {
          logger.info('Google Calendarイベント作成開始');
          // 連絡先をアテンダーとして追加
          const attendees = [
            { email: data.メールアドレス, displayName: data.クライアント名 }
          ];
          
          // イベントタイトルの生成
          const eventTitle = `[マインドエンジニアリング・コーチング] ${data.セッション種別} ${data.クライアント名}様`;
          
          // イベント説明の生成
          const eventDescription = `
マインドエンジニアリング・コーチング ${data.セッション種別}

お名前: ${data.クライアント名}
メールアドレス: ${data.メールアドレス}
電話番号: ${data.電話番号}
セッション形式: ${data.セッション形式}
${data.メモ ? `メモ: ${data.メモ}` : ''}

セッションID: ${sessionId}
クライアントID: ${clientId}
          `;
          
          // Google Calendarイベントの作成
          const calendarEvent = await addCalendarEvent({
            summary: eventTitle,
            description: eventDescription,
            startTime: data.予定日時,
            duration: 30, // 30分セッション
            attendees: attendees,
            createMeet: true, // Google Meetリンクを自動生成
          });
          
          // 作成されたGoogle Meet URLを取得
          if (calendarEvent.conferenceData && 
              calendarEvent.conferenceData.entryPoints && 
              calendarEvent.conferenceData.entryPoints.length > 0) {
            const meetEntryPoint = calendarEvent.conferenceData.entryPoints.find(ep => ep.entryPointType === 'video');
            if (meetEntryPoint) {
              meetUrl = meetEntryPoint.uri;
              logger.info(`Google Meet URL生成成功: ${meetUrl}`);
            }
          }
          
          // カレンダーイベントIDを保存
          calendarEventId = calendarEvent.id;
          logger.info(`カレンダーイベント作成成功: ${calendarEventId}`);
          
        } catch (calendarError) {
          logger.error('Google Calendarイベント作成エラー:', calendarError);
          // フォールバックとして従来のMeet URL生成方法を使用
          const meetDate = new Date(data.予定日時);
          const formattedDate = meetDate.toISOString().replace(/[^a-zA-Z0-9]/g, '');
          meetUrl = `https://meet.google.com/${formattedDate}-mec-${randomStr}`;
        }
      } else {
        // Google Calendar統合が無効な場合は従来のMeet URL生成方法を使用
        const meetDate = new Date(data.予定日時);
        const formattedDate = meetDate.toISOString().replace(/[^a-zA-Z0-9]/g, '');
        meetUrl = `https://meet.google.com/${formattedDate}-mec-${randomStr}`;
      }
    } else {
      // 対面セッションでもGoogle Calendar統合が有効な場合はカレンダーイベントを作成
      if (useGoogleCalendar) {
        try {
          logger.info('対面セッション用のGoogle Calendarイベント作成開始');
          
          // イベントタイトルの生成
          const eventTitle = `[マインドエンジニアリング・コーチング] ${data.セッション種別} ${data.クライアント名}様 (対面)`;
          
          // イベント説明の生成
          const eventDescription = `
マインドエンジニアリング・コーチング ${data.セッション種別} (対面)

お名前: ${data.クライアント名}
メールアドレス: ${data.メールアドレス}
電話番号: ${data.電話番号}
${data.メモ ? `メモ: ${data.メモ}` : ''}

セッションID: ${sessionId}
クライアントID: ${clientId}
          `;
          
          // Google Calendarイベントの作成 (対面なのでMeetリンクは作成しない)
          const calendarEvent = await addCalendarEvent({
            summary: eventTitle,
            description: eventDescription,
            startTime: data.予定日時,
            duration: 30, // 30分セッション
            location: 'マインドエンジニアリング・コーチング 松山オフィス', // オフィス住所を設定する
            createMeet: false, // 対面なのでMeetリンクは不要
          });
          
          // カレンダーイベントIDを保存
          calendarEventId = calendarEvent.id;
          logger.info(`対面セッションのカレンダーイベント作成成功: ${calendarEventId}`);
          
        } catch (calendarError) {
          logger.error('対面セッションのGoogle Calendarイベント作成エラー:', calendarError);
          // エラーがあっても予約プロセスは続行
        }
      }
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
      'Google Calendar ID': calendarEventId || '',
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
        
        logger.info('メール送信の準備を開始');
        
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
        
        logger.info('メール送信データの準備完了');
        
        // メール環境設定の確認
        logger.info('メール送信環境設定確認:', {
          SMTP_HOST: process.env.SMTP_HOST ? '設定あり' : '設定なし',
          SMTP_PORT: process.env.SMTP_PORT || 'デフォルト(587)',
          SMTP_USER: process.env.SMTP_USER ? '設定あり' : '設定なし',
          EMAIL_SENDER: process.env.EMAIL_SENDER || '設定なし'
        });
        
        try {
        // 先にクライアント向けメール送信
        logger.info(`クライアント向けメール送信開始: ${data.メールアドレス}`);
        
        // Nodemailerモードを使用して直接SMTP送信
        try {
          logger.info(`Nodemailerを使用して送信開始`);
          
          // メール本文を生成
          const emailTemplate = isTrialSession ? 'trial-confirmation' : 'continuation-confirmation';
          const content = await renderEmailTemplate(emailTemplate, {
            name: data.クライアント名,
            date: formattedDate,
              format: data.セッション形式 === 'オンライン' ? 'オンライン（Google Meet）' : '対面',
            meetLink: meetUrl || '',
            sessionType: data.セッション種別
          });
          
          // トランスポータを手動作成
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER || process.env.EMAIL_SENDER || 'mindengineeringcoaching@gmail.com',
              pass: process.env.SMTP_PASSWORD
            },
            debug: true,
            logger: true,
            tls: {
              rejectUnauthorized: false
            }
          });
          
          // 送信者の設定
          const senderName = process.env.EMAIL_SENDER_NAME || 'マインドエンジニアリング・コーチング';
          const senderEmail = process.env.EMAIL_SENDER || 'mindengineeringcoaching@gmail.com';
          
          // 直接送信
          const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: data.メールアドレス,
            subject: `【ご予約確定】マインドエンジニアリング・コーチング ${data.セッション種別}`,
            html: content
          });
          
          logger.info(`クライアント向けメール送信成功:`, { messageId: info.messageId });
          
        } catch (nodemailerError) {
          logger.error(`Nodemailerエラー:`, nodemailerError);
          // Nodemailerのエラーをログに記録しても処理継続
        }

        // 以前の送信処理をコメントアウト
        /*
        // Nodemailerモードを強制するオプション追加
        const clientResult = await sendEmail({ ...clientEmailData, useNodemailer: true });
        logger.info(`クライアント向けメール送信成功: ${data.メールアドレス}`);
        
        // 次に管理者向けメール送信
        logger.info(`管理者向けメール送信開始: ${adminEmail}`);
        const adminResult = await sendEmail({ ...adminEmailData, useNodemailer: true });
        logger.info(`管理者向けメール送信成功: ${adminEmail}`);
        */
        
        logger.info('メール送信処理完了');
      } catch (individualEmailError) {
          logger.error('個別メール送信エラー:', individualEmailError);
          // 並行処理で強制変更
          
          // 並行処理でメール送信
          logger.info('並行処理でのメール送信を試みます');
          const emailPromises = [
            sendEmail({ ...clientEmailData, useNodemailer: true }).then(() => {
              logger.info(`クライアント向け予約確認メールを送信しました: ${data.メールアドレス}`);
              return { success: true, recipient: 'client' };
            }).catch(err => {
              logger.error(`クライアントメール送信エラー: ${err.message}`);
              if (err.stack) logger.error(`エラースタック: ${err.stack}`);
              return { success: false, recipient: 'client', error: err.message };
            }),
            
            sendEmail({ ...adminEmailData, useNodemailer: true }).then(() => {
              logger.info(`コーチ向け予約通知メールを送信しました: ${adminEmail}`);
              return { success: true, recipient: 'admin' };
            }).catch(err => {
              logger.error(`管理者メール送信エラー: ${err.message}`);
              if (err.stack) logger.error(`エラースタック: ${err.stack}`);
              return { success: false, recipient: 'admin', error: err.message };
            })
          ];
          
          // メール送信結果をログに記録するが、API応答は成功として処理を継続
          const emailResults = await Promise.allSettled(emailPromises);
          const emailStatus = emailResults.map(result => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              return { success: false, error: result.reason.message, stack: result.reason.stack };
            }
          });
          
          logger.info(`メール送信結果: ${JSON.stringify(emailStatus)}`);
        }
      } catch (emailError) {
        // メール送信エラーはログに記録するが、API応答は成功として返す
        logger.error('予約確認メール送信処理エラー:', emailError);
        logger.error('エラー詳細:', {
          message: emailError.message,
          stack: emailError.stack,
          code: emailError.code,
          response: emailError.response ? JSON.stringify(emailError.response) : 'なし'
        });
        // メール送信エラーでも予約自体は完了させる
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
      meetUrl,
      calendarEventId,
      calendarEnabled: useGoogleCalendar
    });
  } catch (error) {
    logger.error('セッション予約エラー:', error);
    return res.status(500).json({ 
      error: 'セッション予約に失敗しました', 
      details: error.message
    });
  }
}