import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  try {
    // セッション確認（認証済みユーザーのみ許可）
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 環境変数のチェック
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set'
    };
    
    // Google Drive機能は削除されました
    res.status(200).json({ 
      message: 'Google Drive API is no longer supported. Using local storage instead.',
      environmentVariables: envCheck,
      info: 'This API endpoint is for legacy compatibility only.'
    });
  } catch (error) {
    console.error('Error in API test:', error);
    res.status(500).json({ 
      error: 'API test failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
