import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { initializeFirestore } from '../../lib/firebase/init';

export default async function handler(req, res) {
  // 認証チェック
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      await initializeFirestore();
      res.status(200).json({ success: true, message: 'Firebase initialization completed' });
    } catch (error) {
      console.error('API Error - POST /api/init-firebase:', error);
      res.status(500).json({ error: 'Failed to initialize Firebase', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
