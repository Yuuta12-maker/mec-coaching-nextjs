import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getReceiptById, updateReceipt, deleteReceipt } from '../../../lib/receipts';

export default async function handler(req, res) {
  const { id } = req.query;
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // 特定の領収書を取得
        const receipt = await getReceiptById(id);
        
        if (!receipt) {
          return res.status(404).json({ error: 'Receipt not found' });
        }
        
        return res.status(200).json(receipt);
      
      case 'PUT':
        // 領収書を更新
        try {
          const updatedReceipt = await updateReceipt(id, req.body);
          return res.status(200).json(updatedReceipt);
        } catch (updateError) {
          if (updateError.message.includes('not found')) {
            return res.status(404).json({ error: 'Receipt not found' });
          }
          throw updateError;
        }
      
      case 'DELETE':
        // 領収書を削除
        try {
          const result = await deleteReceipt(id);
          return res.status(200).json(result);
        } catch (deleteError) {
          if (deleteError.message.includes('not found')) {
            return res.status(404).json({ error: 'Receipt not found' });
          }
          throw deleteError;
        }
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error handling receipt ${id}:`, error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}