import { sendEmail, EMAIL_TEMPLATES } from '../../../lib/email';
import { apiHandler } from '../../../lib/api-middleware';
import { findRowById } from '../../../lib/sheets';
import logger from '../../../lib/logger';

/**
 * 支払い確認メール送信APIハンドラ
 * @param {object} req - HTTPリクエスト
 * @param {object} res - HTTPレスポンス
 */
async function handler(req, res) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { paymentId } = req.body;

    // パラメータチェック
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: '支払いIDは必須です'
      });
    }

    // 支払い情報取得
    const paymentData = await findRowById('支払い管理', paymentId, '支払いID');
    if (!paymentData) {
      return res.status(404).json({
        success: false,
        message: `指定された支払いID「${paymentId}」のデータが見つかりません`
      });
    }

    // クライアント情報取得
    const clientId = paymentData['クライアントID'];
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: '支払いデータにクライアントIDが含まれていません'
      });
    }

    // クライアント情報取得
    const clientData = await findRowById('クライアントinfo', clientId, 'クライアントID');
    if (!clientData) {
      return res.status(404).json({
        success: false,
        message: `指定されたクライアントID「${clientId}」のデータが見つかりません`
      });
    }

    // メール送信用データ作成
    const emailData = {
      name: clientData['お名前'],
      amount: paymentData['金額'],
      item: paymentData['項目'],
      date: new Date().toLocaleDateString('ja-JP')
    };

    // メール送信
    const result = await sendEmail({
      to: clientData['メールアドレス'],
      subject: 'マインドエンジニアリング・コーチング お支払い確認',
      template: EMAIL_TEMPLATES.PAYMENT_CONFIRMATION,
      data: emailData
    });

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      message: '支払い確認メールを送信しました'
    });

  } catch (error) {
    logger.error('支払い確認メール送信エラー:', error);
    return res.status(500).json({
      success: false,
      message: `メール送信に失敗しました: ${error.message}`
    });
  }
}

export default apiHandler(handler);
