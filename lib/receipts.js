import prisma from './prisma';
import { nanoid } from 'nanoid';
import { addRow, findRowById, getAllRows, updateRow, deleteRow } from './sheets';
import logger from './logger';

// Google Sheetsのテーブル名
const RECEIPTS_TABLE = '領収書';

/**
 * すべての領収書データを取得
 * @returns {Promise<Array>} 領収書の配列
 */
export async function getAllReceipts() {
  try {
    // Google Sheetsからデータを取得
    const rows = await getAllRows(RECEIPTS_TABLE);
    
    // フォーマットを整形
    const receipts = rows.map(row => formatReceiptFromSheet(row));
    
    // 日付順（新しい順）にソート
    return receipts.sort((a, b) => {
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
  } catch (error) {
    logger.error('Error getting all receipts:', error);
    
    // エラーが発生した場合はダミーデータを返す（開発用）
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          id: 'dummy-receipt-1',
          receiptNumber: 'MEC-20250301-001',
          issueDate: '2025-03-01',
          recipientName: 'テスト顧客',
          recipientAddress: '東京都渋谷区',
          email: 'test@example.com',
          description: 'マインドエンジニアリング・コーチング トライアルセッション',
          amount: 6000,
          taxRate: 10,
          paymentMethod: 'bankTransfer',
          issuerName: '森山雄太',
          issuerTitle: 'マインドエンジニアリング・コーチング',
          issuerAddress: '愛媛県松山市湊町2-5-2リコオビル401',
          createdAt: '2025-03-01T09:00:00Z',
          updatedAt: '2025-03-01T09:00:00Z'
        },
        {
          id: 'dummy-receipt-2',
          receiptNumber: 'MEC-20250215-002',
          issueDate: '2025-02-15',
          recipientName: 'サンプルクライアント',
          recipientAddress: '大阪府大阪市',
          email: 'sample@example.com',
          description: 'マインドエンジニアリング・コーチング 継続セッション（2回目〜6回目）',
          amount: 214000,
          taxRate: 10,
          paymentMethod: 'bankTransfer',
          issuerName: '森山雄太',
          issuerTitle: 'マインドエンジニアリング・コーチング',
          issuerAddress: '愛媛県松山市湊町2-5-2リコオビル401',
          createdAt: '2025-02-15T10:30:00Z',
          updatedAt: '2025-02-15T10:30:00Z'
        }
      ];
    }
    
    // 本番環境では空配列を返す
    return [];
  }
}

/**
 * 特定のIDの領収書を取得
 * @param {string} id 領収書ID
 * @returns {Promise<Object|null>} 領収書データまたはnull
 */
export async function getReceiptById(id) {
  try {
    // Google Sheetsからデータを取得
    const row = await findRowById(RECEIPTS_TABLE, id, '領収書ID');
    
    // データが見つからない場合はnull
    if (!row) return null;
    
    // フォーマットを整形して返す
    return formatReceiptFromSheet(row);
  } catch (error) {
    logger.error(`Error getting receipt with ID ${id}:`, error);
    return null;
  }
}

/**
 * 特定のクライアントIDに関連する領収書を取得
 * @param {string} clientId クライアントID
 * @returns {Promise<Array>} 領収書の配列
 */
export async function getReceiptsByClientId(clientId) {
  try {
    // すべての領収書を取得
    const allReceipts = await getAllReceipts();
    
    // クライアントIDでフィルタリング
    return allReceipts.filter(receipt => receipt.clientId === clientId);
  } catch (error) {
    logger.error(`Error getting receipts for client ${clientId}:`, error);
    return [];
  }
}

/**
 * 領収書を新規作成
 * @param {Object} data 領収書データ
 * @returns {Promise<Object>} 作成された領収書データ
 */
export async function createReceipt(data) {
  try {
    // 必要なデータが揃っているか確認
    if (!data.recipientName || !data.amount || !data.description) {
      throw new Error('Required fields missing');
    }
    
    const id = data.id || nanoid();
    const timestamp = new Date().toISOString();
    
    // Google Sheets用のデータ形式に変換
    const rowData = {
      '領収書ID': id,
      '領収書番号': data.receiptNumber,
      '発行日': data.issueDate,
      '宛名': data.recipientName,
      '住所': data.recipientAddress || '',
      'メールアドレス': data.email || '',
      '品目': data.description,
      '金額': data.amount,
      '税率': data.taxRate || 10,
      '支払方法': data.paymentMethod || 'bankTransfer',
      '発行者名': data.issuerName || '森山雄太',
      '発行者肩書': data.issuerTitle || 'マインドエンジニアリング・コーチング',
      '発行者住所': data.issuerAddress || '愛媛県松山市湊町2-5-2リコオビル401',
      '備考': data.notes || '',
      'クライアントID': data.clientId || '',
      '作成日時': timestamp,
      '更新日時': timestamp
    };
    
    // Google Sheetsに保存
    await addRow(RECEIPTS_TABLE, rowData);
    
    // 領収書データを返す
    return {
      id,
      receiptNumber: data.receiptNumber,
      issueDate: data.issueDate,
      recipientName: data.recipientName,
      recipientAddress: data.recipientAddress,
      email: data.email,
      description: data.description,
      amount: parseFloat(data.amount),
      taxRate: parseFloat(data.taxRate || 10),
      paymentMethod: data.paymentMethod,
      issuerName: data.issuerName || '森山雄太',
      issuerTitle: data.issuerTitle || 'マインドエンジニアリング・コーチング',
      issuerAddress: data.issuerAddress || '愛媛県松山市湊町2-5-2リコオビル401',
      notes: data.notes,
      clientId: data.clientId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  } catch (error) {
    logger.error('Error creating receipt:', error);
    throw error;
  }
}

/**
 * 領収書を更新
 * @param {string} id 更新する領収書ID
 * @param {Object} data 更新データ
 * @returns {Promise<Object>} 更新された領収書データ
 */
export async function updateReceipt(id, data) {
  try {
    // 既存の領収書データを取得
    const existingReceipt = await getReceiptById(id);
    if (!existingReceipt) {
      throw new Error(`Receipt with ID ${id} not found`);
    }
    
    const timestamp = new Date().toISOString();
    
    // 更新データを既存データとマージ
    const updatedData = {
      ...existingReceipt,
      ...data,
      updatedAt: timestamp
    };
    
    // Google Sheets用のデータ形式に変換
    const rowData = {
      '領収書ID': id,
      '領収書番号': updatedData.receiptNumber,
      '発行日': updatedData.issueDate,
      '宛名': updatedData.recipientName,
      '住所': updatedData.recipientAddress || '',
      'メールアドレス': updatedData.email || '',
      '品目': updatedData.description,
      '金額': updatedData.amount,
      '税率': updatedData.taxRate,
      '支払方法': updatedData.paymentMethod,
      '発行者名': updatedData.issuerName,
      '発行者肩書': updatedData.issuerTitle,
      '発行者住所': updatedData.issuerAddress,
      '備考': updatedData.notes || '',
      'クライアントID': updatedData.clientId || '',
      '作成日時': existingReceipt.createdAt,
      '更新日時': timestamp
    };
    
    // Google Sheetsを更新
    await updateRow(RECEIPTS_TABLE, id, '領収書ID', rowData);
    
    // 更新された領収書データを返す
    return updatedData;
  } catch (error) {
    logger.error(`Error updating receipt ${id}:`, error);
    throw error;
  }
}

/**
 * 領収書を削除
 * @param {string} id 削除する領収書ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteReceipt(id) {
  try {
    // 領収書データが存在するか確認
    const receipt = await getReceiptById(id);
    if (!receipt) {
      throw new Error(`Receipt with ID ${id} not found`);
    }
    
    // Google Sheetsから削除
    await deleteRow(RECEIPTS_TABLE, id, '領収書ID');
    
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting receipt ${id}:`, error);
    throw error;
  }
}

/**
 * Google Sheetsのデータを標準形式に変換
 * @param {Object} row Google Sheetsから取得した行データ
 * @returns {Object} 標準形式の領収書データ
 */
function formatReceiptFromSheet(row) {
  return {
    id: row['領収書ID'],
    receiptNumber: row['領収書番号'],
    issueDate: row['発行日'],
    recipientName: row['宛名'],
    recipientAddress: row['住所'],
    email: row['メールアドレス'],
    description: row['品目'],
    amount: parseFloat(row['金額']),
    taxRate: parseFloat(row['税率'] || 10),
    paymentMethod: row['支払方法'],
    issuerName: row['発行者名'],
    issuerTitle: row['発行者肩書'],
    issuerAddress: row['発行者住所'],
    notes: row['備考'],
    clientId: row['クライアントID'],
    createdAt: row['作成日時'],
    updatedAt: row['更新日時']
  };
}
