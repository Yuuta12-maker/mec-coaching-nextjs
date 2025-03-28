import { getSession } from 'next-auth/react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import nodemailer from 'nodemailer';
import prisma from '../../../../lib/prisma';
import moment from 'moment';
import { nanoid } from 'nanoid';

// コーポレートカラーを定義（#c50502）
const CORPORATE_COLOR = { r: 0.773, g: 0.020, b: 0.008 };

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  // セッション確認（認証済みユーザーのみ許可）
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 特定の領収書を取得
    const receipt = await prisma.receipt.findUnique({
      where: { id },
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
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    // メールアドレスの確認
    const email = receipt.email || receipt.client?.email;
    
    if (!email) {
      return res.status(400).json({ error: 'No email address found for this receipt' });
    }
    
    // PDF生成
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4サイズ（ポイント単位）
    
    // フォントを設定
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // PDF作成日時
    const createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
    
    // マージン設定
    const margin = 50;
    const width = page.getWidth() - margin * 2;
    
    // 領収書のタイトルを描画
    page.drawText('領　収　書', {
      x: page.getWidth() / 2 - fontBold.widthOfTextAtSize('領　収　書', 28) / 2,
      y: page.getHeight() - margin - 50,
      size: 28,
      font: fontBold,
      color: CORPORATE_COLOR
    });
    
    // 領収書番号
    page.drawText(`No. ${receipt.receiptNumber}`, {
      x: page.getWidth() - margin - fontNormal.widthOfTextAtSize(`No. ${receipt.receiptNumber}`, 10),
      y: page.getHeight() - margin - 20,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 発行日
    const formattedDate = moment(receipt.issueDate).format('YYYY年MM月DD日');
    page.drawText(`発行日: ${formattedDate}`, {
      x: page.getWidth() - margin - fontNormal.widthOfTextAtSize(`発行日: ${formattedDate}`, 10),
      y: page.getHeight() - margin - 35,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 宛名（受領者）
    page.drawText(`${receipt.recipientName}　様`, {
      x: margin,
      y: page.getHeight() - margin - 100,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    // 住所（受領者）
    if (receipt.recipientAddress) {
      page.drawText(receipt.recipientAddress, {
        x: margin,
        y: page.getHeight() - margin - 120,
        size: 10,
        font: fontNormal,
        color: rgb(0, 0, 0)
      });
    }
    
    // 金額部分の背景色を設定（薄いグレー）
    page.drawRectangle({
      x: margin,
      y: page.getHeight() - margin - 180,
      width: width,
      height: 40,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1
    });
    
    // 金額タイトル
    page.drawText('金額', {
      x: margin + 10,
      y: page.getHeight() - margin - 165,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    // 金額（税込）
    const formattedAmount = receipt.amount.toLocaleString() + ' 円';
    page.drawText(formattedAmount, {
      x: page.getWidth() - margin - 10 - fontBold.widthOfTextAtSize(formattedAmount, 16),
      y: page.getHeight() - margin - 167,
      size: 16,
      font: fontBold,
      color: CORPORATE_COLOR
    });
    
    // （税込）表記
    page.drawText('（税込）', {
      x: page.getWidth() - margin - 100,
      y: page.getHeight() - margin - 152,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 内訳テーブルのヘッダー
    const tableTop = page.getHeight() - margin - 200;
    page.drawRectangle({
      x: margin,
      y: tableTop - 25,
      width: width,
      height: 25,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    // 内訳テーブルの列ヘッダー
    page.drawText('品目・摘要', {
      x: margin + 10,
      y: tableTop - 15,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    page.drawText('金額', {
      x: margin + width - 150,
      y: tableTop - 15,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    // 内訳テーブルのデータ行
    page.drawRectangle({
      x: margin,
      y: tableTop - 55,
      width: width,
      height: 30,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    // 品目・摘要
    page.drawText(receipt.description, {
      x: margin + 10,
      y: tableTop - 40,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 金額（税抜）
    const taxAmount = Math.round(receipt.amount * receipt.taxRate / (100 + receipt.taxRate));
    const priceWithoutTax = receipt.amount - taxAmount;
    const formattedPrice = priceWithoutTax.toLocaleString() + ' 円';
    
    page.drawText(formattedPrice, {
      x: margin + width - 150,
      y: tableTop - 40,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 小計行
    page.drawRectangle({
      x: margin,
      y: tableTop - 85,
      width: width,
      height: 30,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    // 小計
    page.drawText('小計', {
      x: margin + 10,
      y: tableTop - 70,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    page.drawText(formattedPrice, {
      x: margin + width - 150,
      y: tableTop - 70,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 消費税行
    page.drawRectangle({
      x: margin,
      y: tableTop - 115,
      width: width,
      height: 30,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    // 消費税
    page.drawText(`消費税（${receipt.taxRate}%）`, {
      x: margin + 10,
      y: tableTop - 100,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    page.drawText(taxAmount.toLocaleString() + ' 円', {
      x: margin + width - 150,
      y: tableTop - 100,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 合計行
    page.drawRectangle({
      x: margin,
      y: tableTop - 145,
      width: width,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    // 合計
    page.drawText('合計', {
      x: margin + 10,
      y: tableTop - 130,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    page.drawText(formattedAmount, {
      x: margin + width - 150,
      y: tableTop - 130,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    // 支払い方法
    const paymentMethodText = {
      bankTransfer: '銀行振込',
      cash: '現金',
      creditCard: 'クレジットカード',
      other: 'その他'
    }[receipt.paymentMethod] || receipt.paymentMethod;
    
    page.drawText(`お支払方法：${paymentMethodText}`, {
      x: margin,
      y: tableTop - 175,
      size: 10,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 備考
    if (receipt.notes) {
      page.drawText('備考：', {
        x: margin,
        y: tableTop - 195,
        size: 10,
        font: fontBold,
        color: rgb(0, 0, 0)
      });
      
      page.drawText(receipt.notes, {
        x: margin,
        y: tableTop - 210,
        size: 10,
        font: fontNormal,
        color: rgb(0, 0, 0)
      });
    }
    
    // 発行者情報を枠で囲む
    page.drawRectangle({
      x: margin,
      y: margin + 80,
      width: width,
      height: 100,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
    
    // 発行者タイトル
    page.drawText('発行者', {
      x: margin + 10,
      y: margin + 160,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    
    // 事業名
    page.drawText(receipt.issuerTitle, {
      x: margin + 10,
      y: margin + 140,
      size: 12,
      font: fontBold,
      color: CORPORATE_COLOR
    });
    
    // 発行者名
    page.drawText(receipt.issuerName, {
      x: margin + 10,
      y: margin + 120,
      size: 11,
      font: fontNormal,
      color: rgb(0, 0, 0)
    });
    
    // 発行者住所
    if (receipt.issuerAddress) {
      page.drawText(receipt.issuerAddress, {
        x: margin + 10,
        y: margin + 100,
        size: 10,
        font: fontNormal,
        color: rgb(0, 0, 0)
      });
    }
    
    // フッター（作成情報）
    page.drawText(`作成: ${createdAt}`, {
      x: margin,
      y: margin - 20,
      size: 8,
      font: fontNormal,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // PDF作成完了
    const pdfBytes = await pdfDoc.save();
    
    // トランスポーターを取得
    const transporter = getTransporter();

    // メール送信
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_SENDER}>`,
      to: email,
      subject: `【マインドエンジニアリング・コーチング】領収書 No.${receipt.receiptNumber}`,
      text: `${receipt.recipientName} 様

マインドエンジニアリング・コーチングをご利用いただき、誠にありがとうございます。
以下の金額につきまして、領収書を添付いたします。

【領収書情報】
領収書番号: ${receipt.receiptNumber}
項目: ${receipt.description}
金額: ${receipt.amount.toLocaleString()}円（税込）

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
      <p>${receipt.recipientName} 様</p>
      
      <p>マインドエンジニアリング・コーチングをご利用いただき、誠にありがとうございます。<br>以下の金額につきまして、領収書を添付いたします。</p>
      
      <div class="receipt-details">
        <p><strong>領収書番号:</strong> ${receipt.receiptNumber}</p>
        <p><strong>項目:</strong> ${receipt.description}</p>
        <p><strong>金額:</strong> <span class="amount">${receipt.amount.toLocaleString()}円（税込）</span></p>
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
          filename: `領収書_${receipt.receiptNumber}_${receipt.recipientName}.pdf`,
          content: Buffer.from(pdfBytes),
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
        recipientName: receipt.recipientName,
        subject: `【マインドエンジニアリング・コーチング】領収書 No.${receipt.receiptNumber}`,
        status: 'sent',
        relatedId: receipt.clientId || null,
        createdAt: new Date(),
        createdBy: session.user.id,
      },
    });

    res.status(200).json({ success: true, messageId: info.messageId, emailLog });
    
  } catch (error) {
    console.error(`Error sending receipt email for ${id}:`, error);
    res.status(500).json({ error: 'Failed to send receipt email', details: error.message });
  }
}