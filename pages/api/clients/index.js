import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getClients, createClient } from '../../../lib/firebase/clients';

export default async function handler(req, res) {
  // 認証チェック
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const clients = await getClients();
      res.status(200).json(clients);
    } catch (error) {
      console.error('API Error - GET /api/clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const clientData = {
        ...req.body,
        createdBy: session.user.id || session.user.email
      };
      
      const newClient = await createClient(clientData);
      res.status(201).json(newClient);
    } catch (error) {
      console.error('API Error - POST /api/clients:', error);
      res.status(500).json({ error: 'Failed to create client', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
