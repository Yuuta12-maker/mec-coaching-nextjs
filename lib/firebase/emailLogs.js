// GoogleDriveバージョンのemailLogs.jsに切り替えるためのプロキシファイル
// 既存のコードがFirebaseのAPIを使用している場合の互換性を確保

import {
  createEmailLog,
  getAllEmailLogs
} from '../googleDrive';

// Firebaseの関数名をエクスポート
export const getEmailLogs = getAllEmailLogs;
// その他の既存の関数をエクスポート
export { createEmailLog };
