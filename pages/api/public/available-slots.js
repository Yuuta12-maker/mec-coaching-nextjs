import { getSheetData, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';
import { SESSION_STATUS } from '../../../lib/constants';
import { getAvailableSlots as getCalendarSlots } from '../../../lib/google-calendar';

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
        // 日本時間で処理するため、タイムゾーン補正
        const sessionDate = new Date(session.予定日時);
        const hours = sessionDate.getHours().toString().padStart(2, '0');
        const minutes = sessionDate.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      });
      
    logger.info(`予約済みの時間帯: ${bookedSlots.join(', ')}`);

    // Google Calendarを使用するかチェック
    const useGoogleCalendar = process.env.ENABLE_GOOGLE_CALENDAR === 'true';
    let availableSlots = [];
    
    // 曜日によって利用可能時間を制限
    const day = targetDate.getDay();
    
    // 土日は予約不可
    if (day === 0 || day === 6) {
      return res.status(200).json({ 
        date: targetDateStr,
        slots: [],
        message: '土曜日・日曜日は予約できません'
      });
    }
    
    if (useGoogleCalendar) {
      // Google Calendarから利用可能な時間枠を取得
      try {
        logger.info('Google Calendarから利用可能時間枠を取得中...');
        availableSlots = await getCalendarSlots(targetDate);
        logger.info(`Google Calendarからの時間枠取得成功: ${availableSlots.filter(s => s.available).length}件の利用可能枠`);
      } catch (calendarError) {
        logger.error('Google Calendarからの時間枠取得エラー:', calendarError);
        // エラーの場合はフォールバックとして従来の方法を使用
        useGoogleCalendar = false;
      }
    }
    
    // Google Calendarを使用しない場合や、エラーがあった場合は従来の方法で時間枠を生成
    if (!useGoogleCalendar) {
      // 平日の予約可能時間帯（10時〜16時、2時間おき）
      const timeSlots = [
        { id: 1, hour: 10, min: '00' },
        { id: 2, hour: 12, min: '00' },
        { id: 3, hour: 14, min: '00' },
        { id: 4, hour: 16, min: '00' },
      ];
      
      // 各時間枠について、予約済みかどうかを確認
      availableSlots = timeSlots.map(slot => {
        const timeStr = `${slot.hour}:${slot.min}`;
        // 既に予約されているかチェック
        const available = !bookedSlots.includes(timeStr);
        
        return {
          id: slot.id,
          time: timeStr,
          available
        };
      });
    }
    
    logger.info(`利用可能な時間枠: ${availableSlots.filter(s => s.available).length}件`);
    logger.debug(`時間枠詳細: ${JSON.stringify(availableSlots)}`)

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