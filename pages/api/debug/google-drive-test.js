import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { testGoogleDriveConnection, createReceipt, getAllReceiptsData } from '../../../lib/googleDrive';

export default async function handler(req, res) {
  try {
    // セッション確認（認証済みユーザーのみ許可）
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // テスト用の処理を実行
    const connectionTest = await testGoogleDriveConnection();
    
    // 環境変数のチェック
    const envCheck = {
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'set' : 'not set',
      GOOGLE_DRIVE_RECEIPTS_FOLDER_ID: process.env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID || 'not set',
      GOOGLE_DRIVE_CLIENTS_FOLDER_ID: process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID || 'not set',
      GOOGLE_DRIVE_SESSIONS_FOLDER_ID: process.env.GOOGLE_DRIVE_SESSIONS_FOLDER_ID || 'not set',
      GOOGLE_DRIVE_PAYMENTS_FOLDER_ID: process.env.GOOGLE_DRIVE_PAYMENTS_FOLDER_ID || 'not set',
      GOOGLE_DRIVE_EMAIL_LOGS_FOLDER_ID: process.env.GOOGLE_DRIVE_EMAIL_LOGS_FOLDER_ID || 'not set',
    };
    
    // テスト用の領収書データを作成（テストモードの場合のみ）
    let testReceiptResult = null;
    let allReceiptsResult = null;
    
    if (req.query.test === 'full' && connectionTest.success) {
      // サンプル領収書データを作成
      const testReceiptData = {
        receiptNumber: `TEST-${Date.now()}`,
        issueDate: new Date().toISOString(),
        recipientName: 'テストユーザー',
        recipientAddress: 'テスト住所',
        email: 'test@example.com',
        description: 'テスト領収書',
        amount: 1000,
        taxRate: 10,
        paymentMethod: 'bankTransfer',
        issuerName: '森山雄太',
        issuerTitle: 'マインドエンジニアリング・コーチング',
        issuerAddress: '〒790-0012 愛媛県松山市湊町2-5-2リコオビル401',
        notes: 'テスト用領収書'
      };
      
      testReceiptResult = await createReceipt(testReceiptData);
      
      // 全ての領収書を取得
      allReceiptsResult = await getAllReceiptsData();
    }
    
    res.status(200).json({ 
      message: 'Google Drive API test results',
      connectionTest,
      environmentVariables: envCheck,
      testReceipt: testReceiptResult,
      allReceipts: allReceiptsResult ? allReceiptsResult.length : null
    });
  } catch (error) {
    console.error('Error in Google Drive test:', error);
    res.status(500).json({ 
      error: 'Google Drive test failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
