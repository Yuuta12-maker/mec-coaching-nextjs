import { findRowById, config } from '../../../lib/sheets';
import { withApiMiddleware, createApiRoute } from '../../../lib/api-middleware';
import logger from '../../../lib/logger';

/**
 * 支払い詳細を取得するAPI
 * 
 * @param {Object} req - リクエストオブジェクト
 * @param {Object} res - レスポンスオブジェクト
 * @returns {Object} 支払い詳細データ
 */
async function getPaymentDetail(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: '支払いIDは必須です' });
  }
  
  try {
    logger.info(`支払い詳細の取得を開始: ID=${id}`);
    
    // 支払い情報を取得
    const payment = await findRowById(config.SHEET_NAMES.PAYMENT, id, '支払いID');
    
    if (!payment) {
      return res.status(404).json({ error: '指定された支払いが見つかりません' });
    }
    
    // クライアント情報も取得する
    const client = await findRowById(config.SHEET_NAMES.CLIENT, payment.クライアントID, 'クライアントID');
    
    if (!client) {
      logger.warn(`支払い ${id} に紐づくクライアントが見つかりません: クライアントID=${payment.クライアントID}`);
    }
    
    // 支払いデータにクライアント名を追加
    const enrichedPayment = {
      ...payment,
      クライアント名: client?.お名前 || '不明',
    };
    
    logger.info(`支払い詳細を返却: ID=${id}, クライアント=${client?.お名前 || '不明'}`);
    return res.status(200).json({ payment: enrichedPayment, client });
    
  } catch (error) {
    logger.error(`支払い詳細取得エラー(ID=${id}):`, error);
    return res.status(500).json({ 
      error: '支払い詳細の取得に失敗しました',
      message: error.message
    });
  }
}

/**
 * 支払い情報を更新するAPI
 * 
 * @param {Object} req - リクエストオブジェクト
 * @param {Object} res - レスポンスオブジェクト
 * @returns {Object} 更新結果
 */
async function updatePayment(req, res) {
  // この関数はエンドポイント /api/payments/update に実装されているため
  // ここでは404を返す
  return res.status(404).json({ error: '更新APIは /api/payments/update を使用してください' });
}

// API ルートを作成（GETとPUTメソッドのみ許可）
export default withApiMiddleware(
  createApiRoute({
    methods: {
      GET: getPaymentDetail,
      PUT: updatePayment
    }
  })
);