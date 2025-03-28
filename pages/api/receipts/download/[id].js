import { getSession } from 'next-auth/react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import prisma from '../../../../lib/prisma';
import moment from 'moment';

// コーポレートカラーを定義（#c50502）
const CORPORATE_COLOR = { r: 0.773, g: 0.020, b: 0.008 };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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
    });
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
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
    
    // バイナリデータとしてPDFを返す
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt_${receipt.receiptNumber}.pdf`);
    res.send(Buffer.from(pdfBytes));
    
  } catch (error) {
    console.error(`Error downloading receipt ${id}:`, error);
    res.status(500).json({ error: 'Failed to download receipt', details: error.message });
  }
}