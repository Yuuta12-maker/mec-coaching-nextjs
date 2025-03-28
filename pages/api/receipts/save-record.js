import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createReceipt, updateReceipt, getReceiptById } from '../../../lib/receipts';

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

    const { id } = req.body; // 既存の領収書IDがあれば使用

    console.log('領収書データ保存開始:', { 
      receiptNumber: req.body.receiptNumber, 
      recipientName: req.body.recipientName, 
      amount: req.body.amount
    });

    let receipt;
    
    // IDが指定されていれば更新、なければ新規作成
    if (id) {
      // 既存の領収書を取得
      const existingReceipt = await getReceiptById(id);
      if (!existingReceipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }
      
      // 既存の領収書を更新
      receipt = await updateReceipt(id, {
        ...req.body,
        updatedBy: session.user.id || session.user.email
      });
      
      console.log('領収書データ更新完了:', { id: receipt.id });
    } else {
      // 新しい領収書を作成
      receipt = await createReceipt({
        ...req.body,
        createdBy: session.user.id || session.user.email
      });
      
      console.log('新規領収書データ作成完了:', { id: receipt.id });
    }
    
    res.status(200).json({ 
      success: true, 
      receipt
    });
    
  } catch (error) {
    console.error('Error saving receipt record:', error);
    res.status(500).json({ 
      error: 'Failed to save receipt record', 
      details: error.message 
    });
  }
}
