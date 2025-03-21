import { sendEmail } from '../../../lib/email';
import { apiHandler } from '../../../lib/api-middleware';
import logger from '../../../lib/logger';

/**
 * メール送信APIハンドラ
 * @param {object} req - HTTPリクエスト
 * @param {object} res - HTTPレスポンス
 */
async function handler(req, res) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const {
      to,
      subject,
      text,
      html,
      template,
      data
    } = req.body;

    // 必須パラメータチェック
    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: '宛先（to）と件名（subject）は必須です'
      });
    }

    // テンプレートまたは本文のどちらかが必要
    if (!template && !text && !html) {
      return res.status(400).json({
        success: false,
        message: 'テンプレート名（template）または本文（text/html）が必要です'
      });
    }

    logger.info(`メール送信リクエスト: 宛先=${to}, 件名=${subject}, テンプレート=${template || 'なし'}`);

    // メール送信実行
    const result = await sendEmail({
      to,
      subject,
      text,
      html,
      template,
      data
    });

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      message: 'メールを送信しました'
    });

  } catch (error) {
    logger.error('メール送信API エラー:', error);
    return res.status(500).json({
      success: false,
      message: `メール送信に失敗しました: ${error.message}`
    });
  }
}

export default apiHandler(handler);
