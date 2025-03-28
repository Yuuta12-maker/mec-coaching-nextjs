import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { nanoid } from 'nanoid';
import formidable from 'formidable';
import nodemailer from 'nodemailer';
import prisma from '../../../lib/prisma';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll use formidable
  },
};

// メール送信用トランスポーターの設定
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// フォームデータを解析する関数
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

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

    // フォームデータを解析
    const { fields, files } = await parseForm(req);
    const data = JSON.parse(fields.data);
    const pdfFile = files.pdf;

    // 必要なデータを取得
    const { 
      receiptNumber, 
      recipientName, 
      email, 
      amount, 
      description 
    } = data;

    // メールアドレスがない場合はエラー
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // トランスポーターを取得
    const transporter = getTransporter();

    // メール送信
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: `【マインドエンジニアリング・コーチング】領収書 No.${receiptNumber}`,
      text: `${recipientName} 様

マインドエンジニアリング・コーチングをご利用いただき、誠にありがとうございます。
以下の金額につきまして、領収書を添付いたします。

【領収書情報】
領収書番号: ${receiptNumber}
項目: ${description}
金額: ${Number(amount).toLocaleString()}円（税込）

何かご不明な点がございましたら、お気軽にお問い合わせください。

=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
マインドエンジニアリング・コーチング
森山 雄太
〒790-0012 愛媛県松山市湊町2-5-2リコオビル401
メール: mindengineeringcoaching@gmail.com
電話: 090-5710-7627
=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=`,
      html: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>領収書</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #c50502;
      margin: 0;
      font-size: 24px;
    }
    .content {
      background-color: #f9f9f9;
      border: 1px solid #eee;
      padding: 20px;
      border-radius: 5px;
    }
    .receipt-details {
      margin-top: 20px;
      background-color: #fff;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 4px;
    }
    .receipt-details p {
      margin: 8px 0;
    }
    .amount {
      font-size: 18px;
      font-weight: bold;
      color: #c50502;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #666;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>マインドエンジニアリング・コーチング</h1>
    </div>
    
    <div class="content">
      <p>${recipientName} 様</p>
      
      <p>マインドエンジニアリング・コーチングをご利用いただき、誠にありがとうございます。<br>以下の金額につきまして、領収書を添付いたします。</p>
      
      <div class="receipt-details">
        <p><strong>領収書番号:</strong> ${receiptNumber}</p>
        <p><strong>項目:</strong> ${description}</p>
        <p><strong>金額:</strong> <span class="amount">${Number(amount).toLocaleString()}円（税込）</span></p>
      </div>
      
      <p>何かご不明な点がございましたら、お気軽にお問い合わせください。</p>
    </div>
    
    <div class="footer">
      <p>
        <strong>マインドエンジニアリング・コーチング</strong><br>
        森山 雄太<br>
        〒790-0012 愛媛県松山市湊町2-5-2リコオビル401<br>
        メール: mindengineeringcoaching@gmail.com<br>
        電話: 090-5710-7627
      </p>
    </div>
  </div>
</body>
</html>`,
      attachments: [
        {
          filename: `領収書_${receiptNumber}_${recipientName}.pdf`,
          path: pdfFile.filepath,
          contentType: 'application/pdf',
        },
      ],
    });

    // 送信ログを記録
    const emailLog = await prisma.emailLog.create({
      data: {
        id: nanoid(),
        type: 'receipt',
        recipientEmail: email,
        recipientName,
        subject: `【マインドエンジニアリング・コーチング】領収書 No.${receiptNumber}`,
        status: 'sent',
        relatedId: data.clientId || null,
        createdAt: new Date(),
        createdBy: session.user.id,
      },
    });

    res.status(200).json({ success: true, messageId: info.messageId, emailLog });
    
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}