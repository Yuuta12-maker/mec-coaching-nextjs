import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;
  
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // 特定の領収書を取得
        const receipt = await prisma.receipt.findUnique({
          where: { id },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
              },
            },
          },
        });
        
        if (!receipt) {
          return res.status(404).json({ error: 'Receipt not found' });
        }
        
        return res.status(200).json(receipt);
      
      case 'PUT':
        // 領収書を更新
        const updatedReceipt = await prisma.receipt.update({
          where: { id },
          data: {
            ...req.body,
            updatedAt: new Date(),
          },
        });
        
        return res.status(200).json(updatedReceipt);
      
      case 'DELETE':
        // 領収書を削除
        await prisma.receipt.delete({
          where: { id },
        });
        
        return res.status(200).json({ success: true });
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error handling receipt ${id}:`, error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}