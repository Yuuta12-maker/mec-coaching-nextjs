import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { nanoid } from 'nanoid';
import moment from 'moment';
import { addRow } from '../../../lib/sheets';

// Google Sheetsに領収書のメタデータのみを保存するシンプルなエンドポイント
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

    const {
      receiptNumber,
      issueDate,
      recipientName,
      recipientAddress,
      email,
      description,
      amount,
      taxRate,
      paymentMethod,
      issuerName,
      clientId
    } = req.body;

    console.log('領収書メタデータ保存開始:', { 
      receiptNumber, 
      recipientName, 
      amount
    });

    // 日付のフォーマット
    const formattedIssueDate = moment(issueDate).format('YYYY-MM-DD');
    
    // 生成時刻
    const createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
    
    // 識別ID
    const id = nanoid();
    
    // Google Sheetsに保存（メタデータのみ）
    await addRow('領収書管理', {
      id,
      receiptNumber,
      issueDate: formattedIssueDate,
      recipientName,
      recipientAddress: recipientAddress || '',
      email: email || '',
      description,
      amount: parseFloat(amount),
      taxRate: parseFloat(taxRate),
      paymentMethod,
      issuerName,
      clientId: clientId || '',
      createdBy: session.user.id || session.user.email,
      createdAt
    });

    console.log('領収書メタデータ保存完了:', id);
    res.status(200).json({ 
      success: true, 
      id, 
      receiptNumber,
      createdAt
    });
    
  } catch (error) {
    console.error('Error saving receipt metadata:', error);
    res.status(500).json({ 
      error: 'Failed to save receipt metadata', 
      details: error.message 
    });
  }
}