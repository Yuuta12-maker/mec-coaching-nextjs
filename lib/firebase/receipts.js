// GoogleDriveバージョンのreceipts.jsに切り替えるためのプロキシファイル
// 既存のコードがFirebaseのAPIを使用している場合の互換性を確保

import {
  getAllReceiptsData,
  findReceiptById,
  getReceiptsByClientId,
  getReceiptByNumber,
  createReceipt,
  updateReceipt,
  deleteReceipt
} from '../googleDrive';

// Firebaseの関数名をエクスポート
export const getReceipts = getAllReceiptsData;
export const getReceiptById = findReceiptById;
// その他の既存の関数をエクスポート
export { getReceiptsByClientId, getReceiptByNumber, createReceipt, updateReceipt, deleteReceipt };
