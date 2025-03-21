import { sendEmail, EMAIL_TEMPLATES } from '../../../lib/email';
import { apiHandler } from '../../../lib/api-middleware';
import { findRowById } from '../../../lib/sheets';
import logger from '../../../lib/logger';

/**
 * セッション確定メール送信APIハンドラ
 * @param {object} req - HTTPリクエスト
 * @param {object} res - HTTPレスポンス
 */
async function handler(req, res) {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { sessionId } = req.body;
    let { clientId } = req.body;

    // パラメータチェック
    if (!sessionId && !clientId) {
      return res.status(400).json({
        success: false,
        message: 'セッションIDまたはクライアントIDが必要です'
      });
    }

    let sessionData;
    let clientData;

    // セッション情報取得
    if (sessionId) {
      sessionData = await findRowById('セッション管理', sessionId, 'セッションID');
      if (!sessionData) {
        return res.status(404).json({
          success: false,
          message: `指定されたセッションID「${sessionId}」のデータが見つかりません`
        });
      }
      
      // クライアントIDがセッションデータにあれば取得
      clientId = sessionData['クライアントID'];
    }

    // クライアント情報取得
    if (clientId) {
      clientData = await findRowById('クライアントinfo', clientId, 'クライアントID');
      if (!clientData) {
        return res.status(404).json({
          success: false,
          message: `指定されたクライアントID「${clientId}」のデータが見つかりません`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'クライアント情報が取得できません'
      });
    }

    // セッションの種類に応じたテンプレート選択
    const isTrialSession = sessionData && sessionData['セッション種別'] === 'トライアル';
    const templateName = isTrialSession
      ? EMAIL_TEMPLATES.TRIAL_CONFIRMATION
      : EMAIL_TEMPLATES.SESSION_REMINDER;

    // 表示用の日時フォーマット
    let formattedDate = '';
    if (sessionData && sessionData['予定日時']) {
      const sessionDate = new Date(sessionData['予定日時']);
      formattedDate = sessionDate.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // メール送信用データ作成
    const emailData = {
      name: clientData['お名前'],
      date: formattedDate,
      format: sessionData ? (sessionData['形式'] || 'オンライン') : 'オンライン',
      meetLink: sessionData ? sessionData['Google Meet URL'] : null,
    };

    // メール送信
    const result = await sendEmail({
      to: clientData['メールアドレス'],
      subject: isTrialSession ? 'トライアルセッションのご案内' : 'セッション日程のご案内',
      template: templateName,
      data: emailData
    });

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      message: 'セッション確定メールを送信しました'
    });

  } catch (error) {
    logger.error('セッション確定メール送信エラー:', error);
    return res.status(500).json({
      success: false,
      message: `メール送信に失敗しました: ${error.message}`
    });
  }
}

export default apiHandler(handler);
