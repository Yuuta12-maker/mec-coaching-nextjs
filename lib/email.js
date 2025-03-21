import { google } from 'googleapis';
import logger from './logger';

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
 * Gmail APIを使用してメールを送信
 * @param {Object} options メール送信オプション
 * @param {string} options.to 宛先メールアドレス
 * @param {string} options.subject メール件名
 * @param {string} options.text プレーンテキスト本文
 * @param {string} options.html HTML本文（省略可）
 * @param {Object} options.data テンプレートに埋め込むデータ（省略可）
 * @param {string} options.template テンプレート名（省略可）
 * @returns {Promise<Object>} 送信結果
 */
export async function sendEmail(options) {
  try {
    logger.info(`メール送信を開始: 宛先=${options.to}, 件名=${options.subject}`);
    
    const auth = await getAuthClient();
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
    logger.error(`メール送信エラー:`, error);
    throw new Error(`メール送信に失敗しました: ${error.message}`);
  }
}

/**
 * メールテンプレートをレンダリング
 * @param {string} templateName テンプレート名
 * @param {Object} data テンプレートに埋め込むデータ
 * @returns {Promise<string>} レンダリングされたHTML
 */
async function renderEmailTemplate(templateName, data = {}) {
  try {
    // 基本的なスタイル設定
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
        padding: 20px;
      }
      .header {
        background-color: #c50502;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .content {
        padding: 20px;
      }
      .footer {
        background-color: #f5f5f5;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: #666;
      }
      .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #c50502;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 15px 0;
      }
    `;
    
    // テンプレート名に基づいてテンプレートを選択
    let template = '';
    
    switch (templateName) {
      case 'trial-confirmation':
        template = `
          <div class="container">
            <div class="header">
              <h1>トライアルセッション確定</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>マインドエンジニアリング・コーチング トライアルセッションのご予約ありがとうございます。</p>
              <p>以下の日程でセッションを実施いたします：</p>
              <p><strong>日時：</strong>${data.date || '（日時情報なし）'}</p>
              <p><strong>形式：</strong>${data.format || 'オンライン'}</p>
              ${data.meetLink ? `<p><strong>GoogleMeet URL：</strong><a href="${data.meetLink}">${data.meetLink}</a></p>` : ''}
              <p>何かご質問がございましたら、お気軽にご連絡ください。</p>
              <p>セッションでお会いできることを楽しみにしております。</p>
              <p>森山雄太<br>マインドエンジニアリング・コーチング</p>
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
              <h1>セッションリマインダー</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>明日のマインドエンジニアリング・コーチングセッションのリマインダーをお送りいたします。</p>
              <p><strong>日時：</strong>${data.date || '（日時情報なし）'}</p>
              <p><strong>形式：</strong>${data.format || 'オンライン'}</p>
              ${data.meetLink ? `<p><strong>GoogleMeet URL：</strong><a href="${data.meetLink}">${data.meetLink}</a></p>` : ''}
              <p>何か準備が必要なことはありません。リラックスした状態でご参加ください。</p>
              <p>何かご質問がございましたら、ご連絡ください。</p>
              <p>お会いできることを楽しみにしております。</p>
              <p>森山雄太<br>マインドエンジニアリング・コーチング</p>
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
        
      case 'program-completion':
        template = `
          <div class="container">
            <div class="header">
              <h1>プログラム完了</h1>
            </div>
            <div class="content">
              <p>${data.name || 'お客様'}様</p>
              <p>マインドエンジニアリング・コーチングプログラムの全セッションが完了しました。</p>
              <p>この6ヶ月間、ともに歩んでいただきありがとうございました。</p>
              <p>これからも${data.name || 'お客様'}様の成長と変化を心より応援しております。</p>
              <p>今後も何かございましたら、いつでもご連絡ください。</p>
              <p>森山雄太<br>マインドエンジニアリング・コーチング</p>
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
  SESSION_REMINDER: 'session-reminder',
  PAYMENT_CONFIRMATION: 'payment-confirmation',
  PROGRAM_COMPLETION: 'program-completion'
};
