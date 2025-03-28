import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { nanoid } from 'nanoid';
import moment from 'moment';
import { saveJsonToGoogleDrive, findReceiptById } from '../../../lib/googleDrive';

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
      id, // 既存の領収書の場合
      fileId, // Google Driveファイルの場合
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
      issuerTitle,
      issuerAddress,
      notes,
      clientId
    } = req.body;

    console.log('領収書データ保存開始:', { 
      receiptNumber, 
      recipientName, 
      amount
    });

    // 日付のフォーマット
    const formattedIssueDate = moment(issueDate).format('YYYY-MM-DD');
    
    // 保存するレシートデータを構築
    let receiptData = {
      id: id || nanoid(),
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
      issuerTitle,
      issuerAddress,
      notes: notes || '',
      clientId: clientId || null,
      createdBy: session.user.id || session.user.email,
      createdAt: id ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // ファイル名は「receipt-{ID}」の形式
    const fileName = `receipt-${receiptData.id}`;
    
    // Google Driveにファイルを保存
    const savedFileId = await saveJsonToGoogleDrive(
      fileName, 
      receiptData, 
      fileId // 既存ファイルの場合はIDを指定、新規の場合はnull
    );
    
    // 保存したファイルIDをレスポンスに含める
    receiptData.fileId = savedFileId;

    console.log('領収書データ保存完了:', {
      id: receiptData.id,
      fileId: savedFileId
    });
    
    res.status(200).json({ 
      success: true, 
      receipt: receiptData 
    });
    
  } catch (error) {
    console.error('Error saving receipt record:', error);
    res.status(500).json({ 
      error: 'Failed to save receipt record', 
      details: error.message 
    });
  }
}
