import { getSheetData, config } from '../../lib/sheets';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // セッションチェック（認証済みかどうか）
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: '認証が必要です' });
  }

  // GETリクエストのみを許可
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'メソッドが許可されていません' });
  }

  try {
    // 各種データを並行して取得
    const [clients, sessions, payments] = await Promise.all([
      getSheetData(config.SHEET_NAMES.CLIENT),
      getSheetData(config.SHEET_NAMES.SESSION),
      getSheetData(config.SHEET_NAMES.PAYMENT)
    ]);
    
    // クライアント統計
    const clientStats = getClientStats(clients);
    
    // セッション統計
    const sessionStats = getSessionStats(sessions);
    
    // 支払い統計
    const paymentStats = getPaymentStats(payments);

    // 今日のセッション
    const todaySessions = getTodaySessions(sessions);
    
    // 直近の支払い
    const recentPayments = getRecentPayments(payments);

    // ダッシュボードデータを返す
    return res.status(200).json({
      clientStats,
      sessionStats,
      paymentStats,
      todaySessions,
      recentPayments
    });
  } catch (error) {
    console.error('ダッシュボードデータ取得エラー:', error);
    return res.status(500).json({ error: 'ダッシュボードデータの取得に失敗しました' });
  }
}

/**
 * クライアント統計を計算する関数
 */
function getClientStats(clients) {
  // 最近追加されたクライアント（過去30日）
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentClients = clients.filter(client => {
    const registeredDate = new Date(client['タイムスタンプ'] || 0);
    return registeredDate >= thirtyDaysAgo;
  });
  
  return {
    total: clients.length,
    recentCount: recentClients.length
  };
}

/**
 * セッション統計を計算する関数
 */
function getSessionStats(sessions) {
  // 次の予定セッション（完了していないもの）
  const upcomingSessions = sessions.filter(session => session['ステータス'] === '予定')
    .sort((a, b) => new Date(a['予定日時']) - new Date(b['予定日時']));
    
  // 完了したセッション
  const completedSessions = sessions.filter(session => session['ステータス'] === '完了');
  
  // セッション種別ごとの数
  const typeCount = sessions.reduce((counts, session) => {
    const type = session['セッション種別'] || 'その他';
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});
  
  return {
    total: sessions.length,
    upcoming: upcomingSessions.length,
    completed: completedSessions.length,
    byType: typeCount
  };
}

/**
 * 支払い統計を計算する関数
 */
function getPaymentStats(payments) {
  // 入金済み金額の合計
  const paidTotal = payments
    .filter(payment => payment['状態'] === '入金済み')
    .reduce((sum, payment) => sum + (parseInt(payment['金額']) || 0), 0);
  
  // 未入金金額の合計
  const unpaidTotal = payments
    .filter(payment => payment['状態'] === '未入金')
    .reduce((sum, payment) => sum + (parseInt(payment['金額']) || 0), 0);
  
  // 項目別の金額
  const byItem = payments.reduce((result, payment) => {
    const item = payment['項目'] || 'その他';
    const amount = parseInt(payment['金額']) || 0;
    
    if (!result[item]) {
      result[item] = { total: 0, paid: 0, unpaid: 0 };
    }
    
    result[item].total += amount;
    
    if (payment['状態'] === '入金済み') {
      result[item].paid += amount;
    } else {
      result[item].unpaid += amount;
    }
    
    return result;
  }, {});
  
  return {
    totalAmount: paidTotal + unpaidTotal,
    paidAmount: paidTotal,
    unpaidAmount: unpaidTotal,
    byItem
  };
}

/**
 * 今日のセッションを取得する関数
 */
function getTodaySessions(sessions) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 今日の日付のセッションだけを抽出
  return sessions
    .filter(session => {
      const sessionDate = new Date(session['予定日時']);
      return sessionDate >= today && sessionDate < tomorrow;
    })
    .sort((a, b) => new Date(a['予定日時']) - new Date(b['予定日時']));
}

/**
 * 直近の支払い記録を取得する関数
 */
function getRecentPayments(payments) {
  // 登録日で並べ替えて直近5件を返す
  return payments
    .sort((a, b) => new Date(b['登録日'] || 0) - new Date(a['登録日'] || 0))
    .slice(0, 5);
}