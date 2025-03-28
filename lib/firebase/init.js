// このファイルはFirebaseからGoogle Driveへの移行時に
// Firebase初期化コードを置き換えるためのダミー実装です

import { db, app, auth } from '../firebase';
import { testGoogleDriveConnection } from '../googleDrive';

// Google Drive APIの接続テスト（フェールセーフ）
export const initServices = async () => {
  try {
    console.log('Testing Google Drive API connection...');
    const testResult = await testGoogleDriveConnection();
    if (testResult.success) {
      console.log('Google Drive API connection successful:', testResult.message);
    } else {
      console.warn('Google Drive API connection failed:', testResult.message);
    }
    return testResult;
  } catch (error) {
    console.error('Error initializing services:', error);
    return { success: false, error };
  }
};

// デフォルトエクスポート（React Componentで使用する場合）
export default function FirebaseInitializer({ children }) {
  // 子コンポーネントをそのまま返す
  return children;
}
