import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { nanoid } from 'nanoid';
import moment from 'moment';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッション確認（認証済みユーザーのみ許可）
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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
      issuerTitle,
      issuerAddress,
      notes,
      clientId
    } = req.body;

    // 領収書データをDBに保存
    const formattedIssueDate = moment(issueDate).format('YYYY-MM-DD');
    
    const receipt = await prisma.receipt.create({
      data: {
        id: nanoid(),
        receiptNumber,
        issueDate: new Date(formattedIssueDate),
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
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: session.user.id,
      }
    });

    res.status(200).json({ success: true, receipt });
    
  } catch (error) {
    console.error('Error saving receipt record:', error);
    res.status(500).json({ error: 'Failed to save receipt record', details: error.message });
  }
}