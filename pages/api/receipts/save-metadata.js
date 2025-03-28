import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createReceipt } from '../../../lib/receipts';
import moment from 'moment';

// 領収書のメタデータを保存するエンドポイント
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッション確認（認証済みユーザーのみ許可）
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      console.error('認証されていないユーザーがアクセスしました');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.log('認証済みユーザー:', session.user?.email);

    console.log('領収書メタデータ保存開始:', { 
      receiptNumber: req.body.receiptNumber, 
      recipientName: req.body.recipientName, 
      amount: req.body.amount
    });

    // メタデータをより整形した形で保存
    const receipt = await createReceipt({
      ...req.body,
      createdBy: session.user.id || session.user.email,
    });

    console.log('領収書メタデータ保存完了:', receipt.id);
    res.status(200).json({ 
      success: true, 
      id: receipt.id, 
      receiptNumber: receipt.receiptNumber,
      createdAt: receipt.createdAt
    });
    
  } catch (error) {
    console.error('Error saving receipt metadata:', error);
    res.status(500).json({ 
      error: 'Failed to save receipt metadata', 
      details: error.message 
    });
  }
}