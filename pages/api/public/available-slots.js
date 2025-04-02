import { getSheetData, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';
import { SESSION_STATUS } from '../../../lib/constants';

export default async function handler(req, res) {
  // 公開APIなのでセッションチェックはスキップ
  
  // GETメソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  try {
    logger.info('利用可能セッション枠API呼び出し');
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: '日付が指定されていません' });
    }

    // 日付のフォーマットチェック (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: '日付の形式が正しくありません (YYYY-MM-DD)' });
    }

    // セッションデータを取得
    let sessions = [];
    try {
      logger.info(`セッションデータ取得: シート「${config.SHEET_NAMES.SESSION}」`);
      sessions = await getSheetData(config.SHEET_NAMES.SESSION);
      logger.info(`セッションデータ取得成功: ${sessions.length}件`);
    } catch (sheetError) {
      logger.error('セッションデータ取得エラー:', sheetError);
      return res.status(500).json({ 
        error: 'データ取得に失敗しました', 
        details: sheetError.message
      });
    }

    // 指定された日付のセッションを抽出
    const targetDate = new Date(date);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // 当日のセッションを抽出
    const sessionsOnDate = sessions.filter(session => {
      if (!session.予定日時) return false;
      const sessionDate = new Date(session.予定日時);
      return sessionDate.toISOString().split('T')[0] === targetDateStr;
    });

    // 既に予約されている時間帯を特定
    const bookedSlots = sessionsOnDate
      .filter(session => session.ステータス !== SESSION_STATUS.CANCELED)
      .map(session => {
        const sessionTime = new Date(session.予定日時).getHours();
        return `${sessionTime}:00`;
      });

    // 利用可能な時間枠を生成 (10時〜17時、1時間ごと)
    const availableSlots = [];
    
    for (let hour = 10; hour <= 16; hour += 2) {
      const timeStr = `${hour}:00`;
      const available = !bookedSlots.includes(timeStr);
      
      availableSlots.push({
        id: hour,
        time: timeStr,
        available
      });
    }

    return res.status(200).json({ 
      date: targetDateStr,
      slots: availableSlots 
    });
  } catch (error) {
    logger.error('利用可能枠取得エラー:', error);
    return res.status(500).json({ 
      error: '予約可能時間の取得に失敗しました', 
      details: error.message
    });
  }
}