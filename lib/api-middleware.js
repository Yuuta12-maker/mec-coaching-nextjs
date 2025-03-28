import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import logger from './logger';

// API Routes用のミドルウェア
// 認証や例外処理を一括して行う
export function withApiMiddleware(handler) {
  return async (req, res) => {
    try {
      // CORS設定
      res.setHeader('Access-Control-Allow-Credentials', true);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // 認証チェック - 必要に応じてコメントアウト解除
      /*
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: '認証が必要です' });
      }
      */

      // ハンドラーを実行
      return await handler(req, res);
    } catch (error) {
      logger.error(`API エラー: ${error.message}`, error);
      
      // エラーレスポンスを返す
      return res.status(500).json({
        error: 'サーバーエラーが発生しました',
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  };
}

// GETリクエストを処理するミドルウェア
export function withGetMethod(handler) {
  return async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    return handler(req, res);
  };
}

// POSTリクエストを処理するミドルウェア
export function withPostMethod(handler) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    return handler(req, res);
  };
}

// 共通のAPI Routeラッパー
export function createApiRoute(config) {
  const { methods = {}, defaultHandler } = config;
  
  return withApiMiddleware(async (req, res) => {
    const method = req.method;
    
    // 対応するメソッドハンドラーがあれば実行
    if (methods[method]) {
      return methods[method](req, res);
    }
    
    // デフォルトハンドラーがあれば実行
    if (defaultHandler) {
      return defaultHandler(req, res);
    }
    
    // 対応するハンドラーがなければ405エラー
    return res.status(405).json({ error: 'Method not allowed' });
  });
}

// 互換性のために追加 - エラーメッセージにあったapiHandler
export const apiHandler = withApiMiddleware;