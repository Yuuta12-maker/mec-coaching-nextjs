/**
 * Nodemailerを使用してメールを送信する代替関数（再試行機能付き）
 * @param {Object} options メール送信オプション
 * @returns {Promise<Object>} 送信結果
 */
export async function sendEmailWithNodemailer(options) {
  // 再試行回数初期化
  const retryCount = options.retryCount || 0;
  
  try {
    logger.info(`Nodemailerでメール送信を開始: 宛先=${options.to}, 件名=${options.subject}, 試行=${retryCount + 1}/${MAX_RETRY_COUNT + 1}`);
    
    // デバッグ用に環境設定を表示
    console.log("Nodemailer環境変数確認:", {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER ? "設定あり" : "設定なし",
      SMTP_SECURE: process.env.SMTP_SECURE,
      EMAIL_SENDER: process.env.EMAIL_SENDER
    });
    
    // メール本文（HTMLまたはテキスト）
    let content = '';
    
    if (options.template) {
      // テンプレートを使用する場合
      content = await renderEmailTemplate(options.template, options.data);
    } else if (options.html) {
      // HTML本文がある場合はそれを使用
      content = options.html;
    } else {
      // プレーンテキスト本文のみの場合
      content = options.text;
    }
    
    // SMTPトランスポータを作成
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'mindengineeringcoaching@gmail.com',
        pass: process.env.SMTP_PASSWORD
      }
    });
    
    // 送信者の設定
    const senderName = process.env.EMAIL_SENDER_NAME || 'マインドエンジニアリング・コーチング';
    const senderEmail = process.env.EMAIL_SENDER || 'mindengineeringcoaching@gmail.com';
    
    console.log("メール送信前の最終確認 (Nodemailer):", {
      to: options.to,
      from: `"${senderName}" <${senderEmail}>`,
      subject: options.subject,
      contentLength: content.length
    });
    
    // メール送信
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: options.to,
      subject: options.subject,
      html: content
    });
    
    logger.info(`Nodemailerメール送信完了: messageId=${info.messageId}`);
    console.log("メール送信成功(Nodemailer):", info);
    
    // メールログを記録
    try {
      await logEmailSent({
        to: options.to,
        subject: options.subject,
        type: options.template || 'custom',
        messageId: info.messageId
      });
    } catch (logError) {
      // ログ記録は失敗してもメール自体は送信されているので警告のみ
      logger.warn(`メールログ記録エラー: ${logError.message}`);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'メールを送信しました'
    };
    
  } catch (error) {
    logger.error(`Nodemailerメール送信エラー (試行=${retryCount + 1}/${MAX_RETRY_COUNT + 1}):`, error);
    console.error("メール送信詳細エラー(Nodemailer):", error);
    
    // 再試行ロジック
    if (retryCount < MAX_RETRY_COUNT) {
      logger.info(`Nodemailerメール送信リトライ (${retryCount + 1}/${MAX_RETRY_COUNT})`);
      
      // 遅延を入れて再試行
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      
      // 再試行
      return sendEmailWithNodemailer({
        ...options,
        retryCount: retryCount + 1
      });
    }
    
    throw new Error(`Nodemailerメール送信に失敗しました: ${error.message}`);
  }
}import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import logger from './logger';

// 最大再試行回数
const MAX_RETRY_COUNT = 3;
// 再試行間隔（ミリ秒）
const RETRY_DELAY_MS = 1000;

// Base64エンコードの補助関数
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * メール送信用の認証クライアントを取得
 * @returns {Promise<any>} 認証済みのGoogleAuthクライアント
 */
async function getAuthClient() {
  try {
    // サービスアカウントのキーを取得
    const serviceAccountKeyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKeyStr) {
      logger.error('環境変数が設定されていません: GOOGLE_SERVICE_ACCOUNT_KEY');
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY 環境変数が設定されていません');
    }
    
    let parsedKey;
    try {
      parsedKey = JSON.parse(serviceAccountKeyStr);
    } catch (parseError) {
      logger.error('JSONパースエラー:', parseError);
      throw new Error(`サービスアカウントキーのJSONパースに失敗しました: ${parseError.message}`);
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials: parsedKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/gmail.send'
      ],
    });
    
    return auth;
  } catch (error) {
    logger.error('認証エラーの詳細:', error);
    throw new Error(`Google APIの認証に失敗しました: ${error.message}`);
  }
}

/**
 * メール送信機能（自動再試行とフォールバック機能付き）
 * Gmail APIを優先使用し、失敗時にNodemailerにフォールバック
 * @param {Object} options メール送信オプション
 * @param {string} options.to 宛先メールアドレス
 * @param {string} options.subject メール件名
 * @param {string} options.text プレーンテキスト本文
 * @param {string} options.html HTML本文（省略可）
 * @param {Object} options.data テンプレートに埋め込むデータ（省略可）
 * @param {string} options.template テンプレート名（省略可）
 * @param {number} options.retryCount 再試行回数（内部使用）
 * @param {boolean} options.useNodemailer 強制的にNodemailerを使用
 * @returns {Promise<Object>} 送信結果
 */
export async function sendEmail(options) {
  // 再試行回数初期化
  const retryCount = options.retryCount || 0;
  
  try {
    logger.info(`メール送信を開始: 宛先=${options.to}, 件名=${options.subject}, 試行=${retryCount + 1}/${MAX_RETRY_COUNT + 1}`);
    
    // デバッグ用に環境設定を表示
    console.log("メール送信環境変数確認:", {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER ? "設定あり" : "設定なし",
      EMAIL_SENDER: process.env.EMAIL_SENDER,
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? "設定あり (先頭10文字): " + process.env.GOOGLE_SERVICE_ACCOUNT_KEY.substring(0, 10) : "設定なし",
      使用送信方法: options.useNodemailer ? "Nodemailer (強制)" : "Gmail API (優先)"
    });
    
    // Nodemailerを優先使用するフラグがある場合、Nodemailerを使用
    if (options.useNodemailer) {
      return await sendEmailWithNodemailer(options);
    }
    
    let auth;
    try {
      auth = await getAuthClient();
    } catch (authError) {
      logger.warn(`Gmail API 認証エラー、Nodemailerにフォールバック: ${authError.message}`);
      return await sendEmailWithNodemailer(options);
    }
    
    const gmail = google.gmail({ version: 'v1', auth });
    
    // 送信者のメールアドレス（設定ファイルまたは環境変数から取得）
    const from = process.env.EMAIL_SENDER || 'マインドエンジニアリング・コーチング <mindengineeringcoaching@gmail.com>';
    
    // メール本文（HTMLまたはテキスト）
    let content = '';
    
    if (options.template) {
      // テンプレートを使用する場合
      content = await renderEmailTemplate(options.template, options.data);
    } else if (options.html) {
      // HTML本文がある場合はそれを使用
      content = options.html;
    } else {
      // プレーンテキスト本文のみの場合
      content = options.text;
    }
    
    // MIMEメッセージの構築
    const messageParts = [
      `From: ${from}`,
      `To: ${options.to}`,
      `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      content
    ];
    
    const message = messageParts.join('\r\n');
    
    // メッセージをBase64URLエンコード
    const encodedMessage = base64UrlEncode(message);
    
    console.log("メール送信前の最終確認:", {
      to: options.to,
      from: from,
      subject: options.subject,
      contentLength: content.length,
      encodedLength: encodedMessage.length
    });
    
    // メール送信
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    logger.info(`メール送信完了: メッセージID=${response.data.id}`);
    
    // メールログを記録
    await logEmailSent({
      to: options.to,
      subject: options.subject,
      type: options.template || 'custom',
      messageId: response.data.id
    });
    
    return {
      success: true,
      messageId: response.data.id,
      message: 'メールを送信しました'
    };
    
  } catch (error) {
    logger.error(`メール送信エラー (試行=${retryCount + 1}/${MAX_RETRY_COUNT + 1}):`, error);
    console.error("メール送信詳細エラー:", error);
    
    // Gmail APIのレスポンスを確認
    if (error.response) {
      console.error("レスポンスエラーデータ:", error.response.data);
      console.error("レスポンスステータス:", error.response.status);
    }
    
    // 再試行ロジック
    if (retryCount < MAX_RETRY_COUNT) {
      logger.info(`メール送信リトライ (${retryCount + 1}/${MAX_RETRY_COUNT})`);
      
      // 遅延を入れて再試行
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      
      // 再試行で再帰呼び出し（カウンターを増やす）
      return sendEmail({
        ...options,
        retryCount: retryCount + 1
      });
    }
    
    // 再試行回数を超えた場合、Nodemailerにフォールバック
    if (!options.useNodemailer) {
      logger.warn(`Gmail API での送信に失敗、Nodemailerにフォールバック`);
      return sendEmailWithNodemailer({
        ...options,
        retryCount: 0 // Nodemailerの再試行カウンターをリセット
      });
    }
    
    throw new Error(`メール送信に失敗しました: ${error.message}`);
  }
}

/**
 * メールテンプレートをレンダリング（改良版）
 * @param {string} templateName テンプレート名
 * @param {Object} data テンプレートに埋め込むデータ
 * @returns {Promise<string>} レンダリングされたHTML
 */
async function renderEmailTemplate(templateName, data = {}) {
  try {
    // 基本的なスタイル設定（レスポンシブ対応強化、デザイン改善）
    const baseStyles = `
      body { 
        font-family: 'Helvetica Neue', Arial, sans-serif; 
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
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
        letter-spacing: 0.5px;
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
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #c50502;
        color: white !important;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
        font-weight: bold;
        text-align: center;
        transition: background-color 0.2s;
      }
      .button:hover {
        background-color: #a00401;
      }
      .highlight-box {
        background-color: #f9f9f9;
        padding: 15px;
        margin: 20px 0;
        border-left: 4px solid #c50502;
        border-radius: 4px;
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
      @media screen and (max-width: 600px) {
        .header {
          padding: 20px 15px;
        }
        .content {
          padding: 20px 15px;
        }
        .button {
          display: block;
          width: 100%;
        }
      }
    `;
    
    // テンプレート名に基づいてテンプレートを選択
    let template = '';
    
    switch (templateName) {
      case 'trial-confirmation':
        template = `
          <div class="container">
            <div class="header">
              <h1>トライアルセッション予約確定</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>マインドエンジニアリング・コーチング トライアルセッションのご予約ありがとうございます。</p>
              <p>以下の日程でセッションを実施いたします：</p>
              
              <div class="session-info">
                <p><strong>■ 日時：</strong>${data.date || '（日時情報なし）'}</p>
                <p><strong>■ 形式：</strong>${data.format || 'オンライン'}</p>
                ${data.meetLink ? `<p><strong>■ Google Meet URL：</strong><a href="${data.meetLink}">${data.meetLink}</a></p><p>（セッション開始時刻になりましたら、上記URLをクリックしてご参加ください）</p>` : ''}
              </div>
              
              <p>当日は、以下のものをご準備いただけますとスムーズです。</p>
              <ul>
                <li>安定したインターネット環境（オンラインの場合）</li>
                <li>静かな環境</li>
                <li>メモを取るものがあると便利です</li>
              </ul>
              
              <p>セッション当日になりましたら、リラックスした状態でご参加ください。特別な準備は必要ありません。</p>
              
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
        break;
        
      case 'continuation-confirmation':
        template = `
          <div class="container">
            <div class="header">
              <h1>継続セッション予約確定</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>マインドエンジニアリング・コーチング ${data.sessionType || '継続セッション'}のご予約ありがとうございます。</p>
              <p>以下の日程でセッションを実施いたします：</p>
              
              <div class="session-info">
                <p><strong>■ 日時：</strong>${data.date || '（日時情報なし）'}</p>
                <p><strong>■ 形式：</strong>${data.format || 'オンライン'}</p>
                ${data.meetLink ? `<p><strong>■ Google Meet URL：</strong><a href="${data.meetLink}">${data.meetLink}</a></p><p>（セッション開始時刻になりましたら、上記URLをクリックしてご参加ください）</p>` : ''}
              </div>
              
              <div class="highlight-box">
                <p><strong>セッションをより充実させるために</strong></p>
                <p>前回のセッションからの進捗や、新たに見えてきたこと、疑問点などをお聞かせいただけると、より効果的なセッションとなります。</p>
                <p>特に以下のような点についてお考えいただけると良いでしょう：</p>
                <ul>
                  <li>前回のセッション後に変化したこと</li>
                  <li>前回設定した行動の進捗状況</li>
                  <li>現在チャレンジしていること</li>
                  <li>今回のセッションで特に焦点を当てたいこと</li>
                </ul>
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
        break;
        
      case 'session-reminder':
        template = `
          <div class="container">
            <div class="header">
              <h1>明日のセッションリマインダー</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>明日のマインドエンジニアリング・コーチングセッションのリマインダーをお送りいたします。</p>
              
              <div class="session-info">
                <p><strong>■ 日時：</strong>${data.date || '（日時情報なし）'}</p>
                <p><strong>■ 形式：</strong>${data.format || 'オンライン'}</p>
                ${data.meetLink ? `<p><strong>■ Google Meet URL：</strong><a href="${data.meetLink}">${data.meetLink}</a></p>` : ''}
              </div>
              
              <p>特別な準備は必要ありません。リラックスした状態でご参加ください。</p>
              <p>オンラインセッションの場合は、セッション開始時刻になりましたら、上記URLをクリックしてご参加ください。</p>
              <p>何かご質問がございましたら、セッション前でもお気軽にご連絡ください。</p>
              <p>明日、お会いできることを楽しみにしております。</p>
              
              <p>森山雄太<br>マインドエンジニアリング・コーチング<br>
              Email: mindengineeringcoaching@gmail.com<br>
              Tel: 090-5710-7627</p>
            </div>
            <div class="footer">
              <p>© マインドエンジニアリング・コーチング</p>
            </div>
          </div>
        `;
        break;
        
      case 'payment-confirmation':
        template = `
          <div class="container">
            <div class="header">
              <h1>お支払い確認</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>マインドエンジニアリング・コーチングへのお支払いを確認いたしました。</p>
              <p><strong>金額：</strong>${data.amount ? `${data.amount.toLocaleString()}円` : '（金額情報なし）'}</p>
              <p><strong>項目：</strong>${data.item || '（項目情報なし）'}</p>
              <p>ご入金ありがとうございました。</p>
              <p>今後ともよろしくお願いいたします。</p>
              <p>森山雄太<br>マインドエンジニアリング・コーチング</p>
            </div>
            <div class="footer">
              <p>© マインドエンジニアリング・コーチング</p>
            </div>
          </div>
        `;
        break;
        
      case 'trial-schedule-request':
        template = `
          <div class="container">
            <div class="header">
              <h1>トライアルセッション日程調整のお知らせ</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>マインドエンジニアリング・コーチングへのお問い合わせありがとうございます。</p>
              <p>トライアルセッションの日程調整をさせていただきたく、ご連絡いたしました。</p>
              <p>以下の候補日時から、ご都合の良い日程をお知らせいただけますと幸いです。</p>
              <ul style="margin-top: 15px; margin-bottom: 15px; padding-left: 20px;">
                ${data.dateOptions ? data.dateOptions.map(date => `<li>${date}</li>`).join('') : `
                <li>4月2日(火) 10:00-10:30</li>
                <li>4月3日(水) 15:00-15:30</li>
                <li>4月4日(木) 19:00-19:30</li>
                `}
              </ul>
              <p>ご都合の良い日程を、このメールへの返信にてお知らせください。</p>
              <p>トライアルセッションは約30分間で、料金は6,000円（税込）となります。</p>
              <p>トライアルセッション日程確定後に、お支払い方法と全体の流れについてご案内いたします。</p>
              <p>何かご不明な点がございましたら、お気軽にお問い合わせください。</p>
              <p>今後ともよろしくお願いいたします。</p>
              <p>森山雄太<br>マインドエンジニアリング・コーチング<br>
Email: mindengineeringcoaching@gmail.com<br>
Tel: 090-5710-7627</p>
            </div>
            <div class="footer">
              <p>© マインドエンジニアリング・コーチング</p>
            </div>
          </div>
        `;
        break;
        
      case 'payment-instruction':
        template = `
          <div class="container">
            <div class="header">
              <h1>お支払いのご案内</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>マインドエンジニアリング・コーチングへのお問い合わせありがとうございます。</p>
              <p>トライアルセッションのお支払い方法についてご案内いたします。</p>
              <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #c50502;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">お支払い情報</p>
                <p style="margin: 0 0 5px 0;"><strong>頒目:</strong> トライアルセッション料金</p>
                <p style="margin: 0 0 5px 0;"><strong>金額:</strong> 6,000円（税込）</p>
                <p style="margin: 0 0 5px 0;"><strong>振込先:</strong></p>
                <p style="margin: 0 0 5px 0; padding-left: 15px;">店名: 六一八</p>
                <p style="margin: 0 0 5px 0; padding-left: 15px;">店番: 618</p>
                <p style="margin: 0 0 5px 0; padding-left: 15px;">普通預金</p>
                <p style="margin: 0 0 5px 0; padding-left: 15px;">口座番号: 1396031</p>
                <p style="margin: 0 0 5px 0; padding-left: 15px;">口座名義: モリヤマユウタ</p>
                <p style="margin: 0 0 5px 0;"><strong>支払い期日:</strong> ${data.paymentDue || 'セッション日の3日前まで'}</p>
              </div>
              <p>お支払いが確認できましたら、改めてセッション詳細をお送りいたします。</p>
              <p>また、トライアルセッション後に継続をご希望される場合は、1週間以内にお知らせください。継続セッション（2～6回目）の料金は214,000円（税込）となります。</p>
              <p>何かご不明な点がございましたら、お気軽にお問い合わせください。</p>
              <p>今後ともよろしくお願いいたします。</p>
              <p>森山雄太<br>マインドエンジニアリング・コーチング<br>
Email: mindengineeringcoaching@gmail.com<br>
Tel: 090-5710-7627</p>
            </div>
            <div class="footer">
              <p>© マインドエンジニアリング・コーチング</p>
            </div>
          </div>
        `;
        break;
        
      default:
        // デフォルトテンプレート
        template = `
          <div class="container">
            <div class="header">
              <h1>${data.title || 'お知らせ'}</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>${data.message || 'マインドエンジニアリング・コーチングからのお知らせです。'}</p>
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
        <title>${data.title || 'マインドエンジニアリング・コーチング'}</title>
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
    
  } catch (error) {
    logger.error(`テンプレートレンダリングエラー:`, error);
    throw new Error(`メールテンプレートのレンダリングに失敗しました: ${error.message}`);
  }
}

/**
 * メール送信ログをスプレッドシートに記録
 * @param {Object} logData ログデータ
 * @returns {Promise<Object>} 記録結果
 */
async function logEmailSent(logData) {
  try {
    // lib/sheets.jsからaddRow関数をインポート
    const { addRow } = await import('./sheets');
    
    // 現在のタイムスタンプ
    const now = new Date();
    const timestamp = now.toISOString();
    
    // ログデータを作成
    const emailLog = {
      'メールID': logData.messageId || `mail_${Date.now()}`,
      '送信日時': timestamp,
      '送信先': logData.to,
      '件名': logData.subject,
      '種類': logData.type || 'その他',
      'ステータス': '送信済み'
    };
    
    // スプレッドシートに追加
    await addRow('メールログ', emailLog);
    
    logger.info(`メールログを記録しました: ${logData.to}, ${logData.subject}`);
    return { success: true };
    
  } catch (error) {
    logger.error(`メールログ記録エラー:`, error);
    // ログ記録失敗はエラーとして投げずに警告のみ
    logger.warn(`メールログの記録に失敗しましたが、メール自体は送信されています`);
    return { success: false, error: error.message };
  }
}

// テンプレートの種類を表すリスト
export const EMAIL_TEMPLATES = {
  TRIAL_CONFIRMATION: 'trial-confirmation',
  CONTINUATION_CONFIRMATION: 'continuation-confirmation',
  SESSION_REMINDER: 'session-reminder',
  PAYMENT_CONFIRMATION: 'payment-confirmation',
  PROGRAM_COMPLETION: 'program-completion',
  TRIAL_SCHEDULE_REQUEST: 'trial-schedule-request',
  PAYMENT_INSTRUCTION: 'payment-instruction'
};
