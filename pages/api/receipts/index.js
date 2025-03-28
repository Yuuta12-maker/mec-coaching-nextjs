import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // 全ての領収書を取得
        const receipts = await prisma.receipt.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
        
        return res.status(200).json(receipts);
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling receipts:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}