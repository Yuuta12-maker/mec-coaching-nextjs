import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getClientById, updateClient, deleteClient } from '../../../lib/firebase/clients';

export default async function handler(req, res) {
  // 認証チェック
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Client ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const client = await getClientById(id);
      
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      res.status(200).json(client);
    } catch (error) {
      console.error('API Error - GET /api/clients/[id]:', error);
      res.status(500).json({ error: 'Failed to fetch client', details: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const clientData = req.body;
      const updatedClient = await updateClient(id, clientData);
      res.status(200).json(updatedClient);
    } catch (error) {
      console.error('API Error - PUT /api/clients/[id]:', error);
      res.status(500).json({ error: 'Failed to update client', details: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      await deleteClient(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('API Error - DELETE /api/clients/[id]:', error);
      res.status(500).json({ error: 'Failed to delete client', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
