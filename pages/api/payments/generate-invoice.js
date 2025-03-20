import { getSession } from 'next-auth/react';
import { findRowById, config } from '../../../lib/sheets';
import logger from '../../../lib/logger';
import * as PDFLib from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// 企業情報（設定で変更可能にするとよい）
const COMPANY_INFO = {
  name: 'マインドエンジニアリング・コーチング',
  representative: '森山 雄太',
  address: '東京都〇〇区〇〇〇〇1-2-3',
  tel: '03-XXXX-XXXX',
  email: 'mindengineeringcoaching@gmail.com',
  bankName: '〇〇銀行',
  branchName: '〇〇支店',
  accountType: '普通',
  accountNumber: 'XXXXXXX',
  accountName: 'マインドエンジニアリングコーチング'
};

// 日付をフォーマットする関数
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// 金額を3桁区切りでフォーマットする関数
const formatCurrency = (amount) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default async function handler(req, res) {
  // POSTリクエストのみを許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // セッションチェック（認証されたユーザーのみ許可）
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 支払いID } = req.body;
    
    // 必須パラメータのバリデーション
    if (!支払いID) {
      return res.status(400).json({ error: '支払いIDは必須です' });
    }
    
    // 支払い情報を取得
    const payment = await findRowById(config.SHEET_NAMES.PAYMENT, 支払いID, '支払いID');
    
    if (!payment) {
      return res.status(404).json({ error: '指定された支払いが見つかりません' });
    }
    
    // クライアント情報を取得
    const client = await findRowById(config.SHEET_NAMES.CLIENT, payment.クライアントID, 'クライアントID');
    
    if (!client) {
      return res.status(404).json({ error: 'クライアント情報が見つかりません' });
    }
    
    // 請求日（今日の日付）
    const invoiceDate = new Date().toISOString().split('T')[0];
    
    // 請求書番号
    const invoiceNumber = `INV-${invoiceDate.replace(/-/g, '')}-${支払いID.slice(-4)}`;
    
    // PDF生成
    // 注意: 本番環境ではPDF-Libを使用してPDFを生成するコードを実装する必要があります
    // 以下はサンプルとしてのプレースホルダーコードです
    
    // PDF生成のサンプルコード
    try {
      // PDF-Libでの実装サンプル（実際の環境に合わせて調整）
      const pdfDoc = await PDFLib.PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4サイズ
      
      const { width, height } = page.getSize();
      
      // フォント設定（日本語フォントを使用する場合は別途対応が必要）
      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
      
      // タイトル
      page.drawText('請求書', {
        x: width / 2 - 40,
        y: height - 50,
        size: 24,
        font: boldFont,
      });
      
      // 請求日
      page.drawText(`請求日: ${formatDate(invoiceDate)}`, {
        x: width - 200,
        y: height - 100,
        size: 12,
        font: font,
      });
      
      // 請求番号
      page.drawText(`請求番号: ${invoiceNumber}`, {
        x: width - 200,
        y: height - 120,
        size: 12,
        font: font,
      });
      
      // 請求元情報
      page.drawText(COMPANY_INFO.name, {
        x: 50,
        y: height - 100,
        size: 14,
        font: boldFont,
      });
      
      page.drawText(`代表者: ${COMPANY_INFO.representative}`, {
        x: 50,
        y: height - 120,
        size: 10,
        font: font,
      });
      
      page.drawText(`住所: ${COMPANY_INFO.address}`, {
        x: 50,
        y: height - 140,
        size: 10,
        font: font,
      });
      
      page.drawText(`TEL: ${COMPANY_INFO.tel}`, {
        x: 50,
        y: height - 160,
        size: 10,
        font: font,
      });
      
      page.drawText(`Email: ${COMPANY_INFO.email}`, {
        x: 50,
        y: height - 180,
        size: 10,
        font: font,
      });
      
      // 請求先情報
      page.drawText(`請求先: ${client.お名前} 様`, {
        x: 50,
        y: height - 240,
        size: 14,
        font: boldFont,
      });
      
      // 金額
      page.drawText('ご請求金額', {
        x: 50,
        y: height - 300,
        size: 14,
        font: boldFont,
      });
      
      page.drawText(`¥${formatCurrency(payment.金額)}`, {
        x: width - 200,
        y: height - 300,
        size: 18,
        font: boldFont,
      });
      
      // 明細
      page.drawLine({
        start: { x: 50, y: height - 340 },
        end: { x: width - 50, y: height - 340 },
        thickness: 1,
      });
      
      page.drawText('項目', {
        x: 50,
        y: height - 360,
        size: 12,
        font: boldFont,
      });
      
      page.drawText('単価', {
        x: width - 200,
        y: height - 360,
        size: 12,
        font: boldFont,
      });
      
      page.drawText('数量', {
        x: width - 150,
        y: height - 360,
        size: 12,
        font: boldFont,
      });
      
      page.drawText('金額', {
        x: width - 100,
        y: height - 360,
        size: 12,
        font: boldFont,
      });
      
      page.drawLine({
        start: { x: 50, y: height - 380 },
        end: { x: width - 50, y: height - 380 },
        thickness: 1,
      });
      
      // 明細1行目
      page.drawText(payment.項目, {
        x: 50,
        y: height - 400,
        size: 10,
        font: font,
      });
      
      page.drawText(`¥${formatCurrency(payment.金額)}`, {
        x: width - 200,
        y: height - 400,
        size: 10,
        font: font,
      });
      
      page.drawText('1', {
        x: width - 150,
        y: height - 400,
        size: 10,
        font: font,
      });
      
      page.drawText(`¥${formatCurrency(payment.金額)}`, {
        x: width - 100,
        y: height - 400,
        size: 10,
        font: font,
      });
      
      page.drawLine({
        start: { x: 50, y: height - 430 },
        end: { x: width - 50, y: height - 430 },
        thickness: 1,
      });
      
      // 合計
      page.drawText('合計', {
        x: width - 250,
        y: height - 450,
        size: 12,
        font: boldFont,
      });
      
      page.drawText(`¥${formatCurrency(payment.金額)}`, {
        x: width - 100,
        y: height - 450,
        size: 12,
        font: boldFont,
      });
      
      page.drawLine({
        start: { x: width - 250, y: height - 470 },
        end: { x: width - 50, y: height - 470 },
        thickness: 1,
      });
      
      // 振込先情報
      page.drawText('お振込先', {
        x: 50,
        y: height - 530,
        size: 14,
        font: boldFont,
      });
      
      page.drawText(`銀行名: ${COMPANY_INFO.bankName}`, {
        x: 50,
        y: height - 560,
        size: 10,
        font: font,
      });
      
      page.drawText(`支店名: ${COMPANY_INFO.branchName}`, {
        x: 50,
        y: height - 580,
        size: 10,
        font: font,
      });
      
      page.drawText(`口座種別: ${COMPANY_INFO.accountType}`, {
        x: 50,
        y: height - 600,
        size: 10,
        font: font,
      });
      
      page.drawText(`口座番号: ${COMPANY_INFO.accountNumber}`, {
        x: 50,
        y: height - 620,
        size: 10,
        font: font,
      });
      
      page.drawText(`口座名義: ${COMPANY_INFO.accountName}`, {
        x: 50,
        y: height - 640,
        size: 10,
        font: font,
      });
      
      // 備考
      page.drawText('備考', {
        x: 50,
        y: height - 680,
        size: 14,
        font: boldFont,
      });
      
      page.drawText('この度はご利用いただき誠にありがとうございます。', {
        x: 50,
        y: height - 710,
        size: 10,
        font: font,
      });
      
      page.drawText('上記金額を期日までにお振込みいただきますようお願い申し上げます。', {
        x: 50,
        y: height - 730,
        size: 10,
        font: font,
      });
      
      // PDFをバイナリ形式で取得
      const pdfBytes = await pdfDoc.save();
      
      // PDFをレスポンスとして返す
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice_${invoiceNumber}.pdf"`);
      
      // バッファに変換してレスポンスとして送信
      res.send(Buffer.from(pdfBytes));
      
      logger.info(`請求書を生成しました: ID=${支払いID}, クライアント=${client.お名前}, 請求番号=${invoiceNumber}`);
    } catch (pdfError) {
      logger.error('PDF生成エラー:', pdfError);
      return res.status(500).json({ error: `PDF生成に失敗しました: ${pdfError.message}` });
    }
    
  } catch (error) {
    logger.error('請求書生成エラー:', error);
    return res.status(500).json({ error: `請求書の生成に失敗しました: ${error.message}` });
  }
}