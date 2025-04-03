import { google } from 'googleapis';
import logger from './logger';

// Google APIクライアントの設定
const createCalendarClient = () => {
  try {
    // サービスアカウントキーから情報を抽出
    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (parseError) {
      logger.error('GOOGLE_SERVICE_ACCOUNT_KEYのParseエラー:', parseError);
      throw new Error('サービスアカウントキーが正しいJSON形式ではありません');
    }

    // 認証情報の作成
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/calendar'],
    );

    // Google Calendar APIクライアントを作成
    const calendar = google.calendar({ version: 'v3', auth });
    return calendar;
  } catch (error) {
    logger.error('Google Calendar クライアント作成エラー:', error);
    throw error;
  }
};

/**
 * Googleカレンダーにイベントを追加する
 * @param {Object} eventData イベントデータ
 * @returns {Promise<Object>} 作成されたイベントのデータ
 */
export const addCalendarEvent = async (eventData) => {
  try {
    const calendar = createCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // イベントの開始・終了時間を設定
    const startTime = new Date(eventData.startTime);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + (eventData.duration || 30)); // デフォルト30分

    // カレンダーイベントの設定
    const event = {
      summary: eventData.summary,
      description: eventData.description || '',
      location: eventData.location || '',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Tokyo',
      },
      attendees: eventData.attendees || [],
      // Google Meetを自動作成する設定（オプション）
      conferenceData: eventData.createMeet ? {
        createRequest: {
          requestId: `mec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      } : undefined,
    };

    // Google Meetリンクを自動生成する場合は、conferenceDataVersionを1に設定
    const conferenceDataVersion = eventData.createMeet ? 1 : 0;

    // カレンダーにイベントを追加
    const response = await calendar.events.insert({
      calendarId,
      resource: event,
      conferenceDataVersion,
      sendUpdates: 'all', // 出席者に通知メールを送信
    });

    logger.info(`イベントが作成されました: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    logger.error('カレンダーイベント作成エラー:', error);
    throw error;
  }
};

/**
 * Googleカレンダーのイベントを更新する
 * @param {string} eventId イベントID
 * @param {Object} eventData 更新データ
 * @returns {Promise<Object>} 更新されたイベントのデータ
 */
export const updateCalendarEvent = async (eventId, eventData) => {
  try {
    const calendar = createCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // 既存のイベントを取得
    const existingEvent = await calendar.events.get({
      calendarId,
      eventId,
    });

    // 更新データを準備
    const updatedEvent = {
      ...existingEvent.data,
      ...eventData,
    };

    // 開始・終了時間が更新データに含まれている場合は更新
    if (eventData.startTime) {
      const startTime = new Date(eventData.startTime);
      updatedEvent.start = {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Tokyo',
      };

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (eventData.duration || 30));
      updatedEvent.end = {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Tokyo',
      };
    }

    // イベントを更新
    const response = await calendar.events.update({
      calendarId,
      eventId,
      resource: updatedEvent,
      sendUpdates: 'all', // 出席者に通知メールを送信
    });

    logger.info(`イベントが更新されました: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    logger.error('カレンダーイベント更新エラー:', error);
    throw error;
  }
};

/**
 * Googleカレンダーのイベントを削除する
 * @param {string} eventId イベントID
 * @returns {Promise<boolean>} 削除成功時はtrue
 */
export const deleteCalendarEvent = async (eventId) => {
  try {
    const calendar = createCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all', // 出席者に通知メールを送信
    });

    logger.info(`イベントが削除されました: ${eventId}`);
    return true;
  } catch (error) {
    logger.error('カレンダーイベント削除エラー:', error);
    throw error;
  }
};

/**
 * カレンダーの利用可能時間枠を取得する
 * @param {Date} date 対象日付
 * @returns {Promise<Array>} 利用可能な時間枠の配列
 */
export const getAvailableSlots = async (date) => {
  try {
    const calendar = createCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // 対象日の開始・終了時刻
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // カレンダーからイベントを取得
    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    logger.info(`${date.toISOString().split('T')[0]} の予定数: ${events.length}`);

    // 予約済み時間帯を抽出
    const bookedSlots = events.map(event => {
      const start = new Date(event.start.dateTime || event.start.date);
      return {
        id: event.id,
        time: `${start.getHours()}:${String(start.getMinutes()).padStart(2, '0')}`,
        summary: event.summary
      };
    });

    // 曜日によって利用可能時間を制限 (ReservationSystem.jsの仕様に合わせる)
    const day = date.getDay();
    
    // 土日は予約不可
    if (day === 0 || day === 6) {
      return [];
    }
    
    // 平日の予約可能時間帯（10時〜16時、2時間おき）
    const timeSlots = [
      { id: 1, hour: 10, min: '00' },
      { id: 2, hour: 12, min: '00' },
      { id: 3, hour: 14, min: '00' },
      { id: 4, hour: 16, min: '00' },
    ];
    
    // 各時間枠について、予約済みかどうかを確認
    const availableSlots = timeSlots.map(slot => {
      const timeStr = `${slot.hour}:${slot.min}`;
      // 予約済みかチェック
      const booked = bookedSlots.some(bs => bs.time === timeStr);
      
      return {
        id: slot.id,
        time: timeStr,
        available: !booked
      };
    });

    return availableSlots;
  } catch (error) {
    logger.error('利用可能時間枠取得エラー:', error);
    throw error;
  }
};

export default {
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getAvailableSlots
};
