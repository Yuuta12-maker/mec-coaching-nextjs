import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { findReceiptById, saveJsonToGoogleDrive, deleteFileFromGoogleDrive } from '../../../lib/googleDrive';

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
        const receipt = await findReceiptById(id);
        
        if (!receipt) {
          return res.status(404).json({ error: 'Receipt not found' });
        }
        
        return res.status(200).json(receipt);
      
      case 'PUT':
        // 既存の領収書データを取得
        const existingReceipt = await findReceiptById(id);
        
        if (!existingReceipt) {
          return res.status(404).json({ error: 'Receipt not found' });
        }
        
        // データを更新
        const updatedData = {
          ...existingReceipt,
          ...req.body,
          id: id, // IDは常に保持
          updatedAt: new Date().toISOString()
        };
        
        // ファイル名は「receipt-{ID}」の形式を維持
        const fileName = `receipt-${id}`;
        
        // Google Driveファイルを更新
        const fileId = await saveJsonToGoogleDrive(
          fileName,
          updatedData,
          existingReceipt.fileId // 更新するファイルのID
        );
        
        return res.status(200).json({
          ...updatedData,
          fileId
        });
      
      case 'DELETE':
        // 削除する領収書を検索
        const receiptToDelete = await findReceiptById(id);
        
        if (!receiptToDelete) {
          return res.status(404).json({ error: 'Receipt not found' });
        }
        
        // ファイルIDがある場合はGoogle Driveから削除
        if (receiptToDelete.fileId) {
          await deleteFileFromGoogleDrive(receiptToDelete.fileId);
        }
        
        return res.status(200).json({ success: true });
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error handling receipt ${id}:`, error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}