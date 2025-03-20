import { getSheetData } from '../../../lib/sheets';
import { withApiMiddleware, withGetMethod } from '../../../lib/api-middleware';
import { DB_TABLES } from '../../../lib/api-config';
import logger from '../../../lib/logger';

/**
 * 支払い一覧を取得するAPI
 * 
 * @param {Object} req - リクエストオブジェクト
 * @param {Object} res - レスポンスオブジェクト
 * @returns {Object} 支払い一覧データ
 */
async function handler(req, res) {
  try {
    logger.info('支払い一覧の取得を開始');
    
    // クエリパラメータから各種フィルタリング条件を取得
    const { status, clientId, startDate, endDate, sort } = req.query;
    
    // 支払いデータを取得
    const payments = await getSheetData(DB_TABLES.PAYMENT);
    
    // フィルタリング
    let filteredPayments = [...payments];
    
    // 状態でフィルタリング
    if (status) {
      filteredPayments = filteredPayments.filter(payment => payment.状態 === status);
    }
    
    // クライアントIDでフィルタリング
    if (clientId) {
      filteredPayments = filteredPayments.filter(payment => payment.クライアントID === clientId);
    }
    
    // 日付範囲でフィルタリング
    if (startDate) {
      const start = new Date(startDate);
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.登録日 || 0);
        return paymentDate >= start;
      });
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // 終了日の終わりまで
      filteredPayments = filteredPayments.filter(payment => {
        const paymentDate = new Date(payment.登録日 || 0);
        return paymentDate <= end;
      });
    }
    
    // ソート
    if (sort) {
      const [field, order] = sort.split(':');
      const isAsc = order !== 'desc';
      
      filteredPayments.sort((a, b) => {
        let valueA, valueB;
        
        // 日付フィールド
        if (field === '登録日' || field === '入金日') {
          valueA = new Date(a[field] || 0).getTime();
          valueB = new Date(b[field] || 0).getTime();
        } 
        // 数値フィールド
        else if (field === '金額') {
          valueA = Number(a[field] || 0);
          valueB = Number(b[field] || 0);
        } 
        // その他の文字列フィールド
        else {
          valueA = a[field] || '';
          valueB = b[field] || '';
        }
        
        // ソート順に応じて結果を返す
        if (isAsc) {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    } else {
      // デフォルトのソート（登録日の降順）
      filteredPayments.sort((a, b) => 
        new Date(b.登録日 || 0) - new Date(a.登録日 || 0)
      );
    }
    
    logger.info(`支払い ${filteredPayments.length}件のデータを返却`);
    // クライアント一覧と同じ形式でレスポンスを返す
    return res.status(200).json({
      payments: filteredPayments
    });
    
  } catch (error) {
    logger.error('支払い一覧取得エラー:', error);
    return res.status(500).json({ 
      error: '支払いデータの取得に失敗しました',
      message: error.message
    });
  }
}

// API ミドルウェアで GET メソッドのみに制限し、エラーハンドリングを追加
export default withApiMiddleware(withGetMethod(handler));