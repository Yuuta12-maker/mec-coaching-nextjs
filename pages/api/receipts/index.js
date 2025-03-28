import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getAllReceiptsData } from '../../../lib/googleDrive';

export default async function handler(req, res) {
  // 認証チェック
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // クエリパラメータを取得
      const { clientId } = req.query;
      
      // Google Driveからすべての領収書データを取得
      const allReceipts = await getAllReceiptsData();
      
      // クライアントIDでフィルタリング（指定されている場合）
      const receipts = clientId
        ? allReceipts.filter(receipt => receipt.clientId === clientId)
        : allReceipts;
      
      // 日付順にソート（新しい順）
      receipts.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a._lastModified);
        const dateB = new Date(b.updatedAt || b._lastModified);
        return dateB - dateA;
      });
      
      res.status(200).json(receipts);
    } catch (error) {
      console.error('API Error - GET /api/receipts:', error);
      res.status(500).json({ 
        error: 'Failed to fetch receipts', 
        details: error.message 
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
