import { google } from 'googleapis';
import { nanoid } from 'nanoid';

// サービスアカウント認証情報を環境変数から取得
const CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  : null;

// 各種ドキュメント保存用のGoogle DriveフォルダID
const RECEIPTS_FOLDER_ID = process.env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID;
const CLIENTS_FOLDER_ID = process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID;
const SESSIONS_FOLDER_ID = process.env.GOOGLE_DRIVE_SESSIONS_FOLDER_ID;
const PAYMENTS_FOLDER_ID = process.env.GOOGLE_DRIVE_PAYMENTS_FOLDER_ID;
const EMAIL_LOGS_FOLDER_ID = process.env.GOOGLE_DRIVE_EMAIL_LOGS_FOLDER_ID;

/**
 * Google Drive APIのauthクライアントを初期化
 * @returns {google.auth.JWT} 認証済みJWTクライアント
 */
const getAuthClient = () => {
  if (!CREDENTIALS) {
    console.warn('Google Service Account credentials are not configured, using dummy implementation');
    return null;
  }

  try {
    const client = new google.auth.JWT(
      CREDENTIALS.client_email,
      null,
      CREDENTIALS.private_key,
      ['https://www.googleapis.com/auth/drive.file']
    );

    return client;
  } catch (error) {
    console.error('Error initializing Google auth client:', error);
    return null;
  }
};

/**
 * Google Drive APIクライアントを初期化
 * @returns {google.drive_v3.Drive} Drive APIクライアント
 */
const getDriveClient = () => {
  const authClient = getAuthClient();
  if (!authClient) return null;
  
  return google.drive({ version: 'v3', auth: authClient });
};

/**
 * JSONデータをGoogle Driveに保存
 * @param {string} fileName ファイル名（拡張子なし）
 * @param {object} data 保存するJSONデータ
 * @param {string} [fileId] 既存ファイルのID（更新の場合）
 * @param {string} [folderId] 保存先フォルダID
 * @returns {Promise<string>} 保存したファイルのID
 */
export const saveJsonToGoogleDrive = async (fileName, data, fileId = null, folderId = null) => {
  try {
    const drive = getDriveClient();
    if (!drive) throw new Error('Google Drive client not initialized');
    
    const fileMetadata = {
      name: `${fileName}.json`,
      mimeType: 'application/json',
    };
    
    if (!fileId) {
      // フォルダIDが指定されている場合は、そのフォルダ内に保存
      if (folderId) {
        fileMetadata.parents = [folderId];
      }
    }

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(data, null, 2)
    };

    let response;
    if (fileId) {
      // 既存ファイルの更新
      response = await drive.files.update({
        fileId,
        resource: fileMetadata,
        media,
        fields: 'id'
      });
    } else {
      // 新規ファイルの作成
      response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id'
      });
    }

    return response.data.id;
  } catch (error) {
    console.error('Error saving to Google Drive:', error);
    throw error;
  }
};

/**
 * Google Driveから指定したIDのJSONファイルを取得
 * @param {string} fileId 取得するファイルのID
 * @returns {Promise<object>} 取得したJSONデータ
 */
export const getJsonFromGoogleDrive = async (fileId) => {
  try {
    const drive = getDriveClient();
    if (!drive) throw new Error('Google Drive client not initialized');
    
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    });

    return response.data;
  } catch (error) {
    console.error('Error getting file from Google Drive:', error);
    throw error;
  }
};

/**
 * 指定フォルダ内のJSONファイル一覧を取得
 * @param {string} [folderId] 検索対象のフォルダID
 * @returns {Promise<Array>} ファイル情報の配列
 */
export const listJsonFilesInFolder = async (folderId) => {
  try {
    const drive = getDriveClient();
    if (!drive) throw new Error('Google Drive client not initialized');
    
    const query = folderId 
      ? `'${folderId}' in parents and mimeType='application/json'` 
      : `mimeType='application/json'`;
    
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, createdTime, modifiedTime)'
    });

    return response.data.files;
  } catch (error) {
    console.error('Error listing files from Google Drive:', error);
    throw error;
  }
};

/**
 * Google Driveからファイルを削除
 * @param {string} fileId 削除するファイルのID
 * @returns {Promise<void>}
 */
export const deleteFileFromGoogleDrive = async (fileId) => {
  try {
    const drive = getDriveClient();
    if (!drive) throw new Error('Google Drive client not initialized');
    
    await drive.files.delete({
      fileId
    });
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw error;
  }
};

// ===============================
// 領収書関連の機能
// ===============================

/**
 * 領収書データを取得（すべてのJSONファイルを取得して結合）
 * @returns {Promise<Array>} すべての領収書データの配列
 */
export const getAllReceiptsData = async () => {
  try {
    // フォルダ内のすべてのJSONファイルをリスト
    const files = await listJsonFilesInFolder(RECEIPTS_FOLDER_ID);
    
    // 各ファイルのデータを取得
    const receiptsPromises = files.map(async (file) => {
      const fileData = await getJsonFromGoogleDrive(file.id);
      // ファイルIDも含める（更新用）
      return {
        ...fileData,
        fileId: file.id,
        _lastModified: file.modifiedTime
      };
    });
    
    // すべてのPromiseが完了するのを待つ
    const receiptsData = await Promise.all(receiptsPromises);
    
    // 更新日時でソート（新しい順）
    return receiptsData.sort((a, b) => 
      new Date(b._lastModified) - new Date(a._lastModified)
    );
  } catch (error) {
    console.error('Error getting all receipts data:', error);
    return [];
  }
};

/**
 * 特定の領収書IDに基づいてデータを検索
 * @param {string} receiptId 検索する領収書ID
 * @returns {Promise<Object|null>} 領収書データ（見つからない場合はnull）
 */
export const findReceiptById = async (receiptId) => {
  try {
    const allReceipts = await getAllReceiptsData();
    return allReceipts.find(receipt => receipt.id === receiptId) || null;
  } catch (error) {
    console.error('Error finding receipt by ID:', error);
    return null;
  }
};

/**
 * クライアントIDに基づいて領収書を検索
 * @param {string} clientId クライアントID
 * @returns {Promise<Array>} 該当する領収書の配列
 */
export const getReceiptsByClientId = async (clientId) => {
  try {
    const allReceipts = await getAllReceiptsData();
    return allReceipts.filter(receipt => receipt.clientId === clientId);
  } catch (error) {
    console.error('Error getting receipts by client ID:', error);
    return [];
  }
};

/**
 * 領収書番号から領収書を検索
 * @param {string} receiptNumber 領収書番号
 * @returns {Promise<Object|null>} 領収書データ（見つからない場合はnull）
 */
export const getReceiptByNumber = async (receiptNumber) => {
  try {
    const allReceipts = await getAllReceiptsData();
    return allReceipts.find(receipt => receipt.receiptNumber === receiptNumber) || null;
  } catch (error) {
    console.error('Error getting receipt by number:', error);
    return null;
  }
};

/**
 * 領収書データを作成
 * @param {Object} receiptData 領収書データ
 * @returns {Promise<Object>} 作成した領収書データとファイルID
 */
export const createReceipt = async (receiptData) => {
  try {
    const id = receiptData.id || nanoid();
    const timestamp = new Date().toISOString();
    
    // データを整形
    const formattedData = {
      ...receiptData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // ファイル名は「receipt-{ID}」の形式
    const fileName = `receipt-${id}`;
    
    // Google Driveに保存
    const fileId = await saveJsonToGoogleDrive(fileName, formattedData, null, RECEIPTS_FOLDER_ID);
    
    // ファイルIDを含めて返す
    return {
      ...formattedData,
      fileId
    };
  } catch (error) {
    console.error('Error creating receipt:', error);
    throw error;
  }
};

/**
 * 領収書データを更新
 * @param {string} id 領収書ID
 * @param {Object} receiptData 更新データ
 * @returns {Promise<Object>} 更新した領収書データとファイルID
 */
export const updateReceipt = async (id, receiptData) => {
  try {
    // 既存の領収書を取得
    const existingReceipt = await findReceiptById(id);
    if (!existingReceipt) {
      throw new Error(`Receipt with ID ${id} not found`);
    }
    
    // データを更新
    const updatedData = {
      ...existingReceipt,
      ...receiptData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    // ファイル名は「receipt-{ID}」の形式
    const fileName = `receipt-${id}`;
    
    // Google Driveファイルを更新
    const fileId = await saveJsonToGoogleDrive(
      fileName,
      updatedData,
      existingReceipt.fileId
    );
    
    // 更新後のデータを返す
    return {
      ...updatedData,
      fileId
    };
  } catch (error) {
    console.error('Error updating receipt:', error);
    throw error;
  }
};

/**
 * 領収書を削除
 * @param {string} id 削除する領収書ID
 * @returns {Promise<{success: boolean}>}
 */
export const deleteReceipt = async (id) => {
  try {
    // 削除する領収書を検索
    const receiptToDelete = await findReceiptById(id);
    if (!receiptToDelete) {
      throw new Error(`Receipt with ID ${id} not found`);
    }
    
    // ファイルIDがある場合はGoogle Driveから削除
    if (receiptToDelete.fileId) {
      await deleteFileFromGoogleDrive(receiptToDelete.fileId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting receipt:', error);
    throw error;
  }
};

// ===============================
// メールログ関連の機能
// ===============================

/**
 * メールログを作成
 * @param {Object} emailLogData メールログデータ
 * @returns {Promise<Object>} 作成したメールログとファイルID
 */
export const createEmailLog = async (emailLogData) => {
  try {
    const id = emailLogData.id || nanoid();
    const timestamp = new Date().toISOString();
    
    // データを整形
    const formattedData = {
      ...emailLogData,
      id,
      createdAt: timestamp
    };
    
    // ファイル名は「email-log-{ID}」の形式
    const fileName = `email-log-${id}`;
    
    // Google Driveに保存
    const fileId = await saveJsonToGoogleDrive(fileName, formattedData, null, EMAIL_LOGS_FOLDER_ID);
    
    // ファイルIDを含めて返す
    return {
      ...formattedData,
      fileId
    };
  } catch (error) {
    console.error('Error creating email log:', error);
    throw error;
  }
};

/**
 * すべてのメールログを取得
 * @returns {Promise<Array>} メールログの配列
 */
export const getAllEmailLogs = async () => {
  try {
    // フォルダ内のすべてのJSONファイルをリスト
    const files = await listJsonFilesInFolder(EMAIL_LOGS_FOLDER_ID);
    
    // 各ファイルのデータを取得
    const logsPromises = files.map(async (file) => {
      const fileData = await getJsonFromGoogleDrive(file.id);
      return {
        ...fileData,
        fileId: file.id,
        _lastModified: file.modifiedTime
      };
    });
    
    // すべてのPromiseが完了するのを待つ
    const logsData = await Promise.all(logsPromises);
    
    // 更新日時でソート（新しい順）
    return logsData.sort((a, b) => 
      new Date(b.createdAt || b._lastModified) - new Date(a.createdAt || a._lastModified)
    );
  } catch (error) {
    console.error('Error getting all email logs:', error);
    return [];
  }
};

// ==========================================
// Google Drive APIの接続テスト
// ==========================================

/**
 * Google Drive API接続テスト
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const testGoogleDriveConnection = async () => {
  try {
    const drive = getDriveClient();
    if (!drive) {
      return {
        success: false,
        message: 'Google Drive client not initialized. Check your credentials.'
      };
    }
    
    // 簡単なAPI呼び出しでテスト
    const response = await drive.files.list({
      pageSize: 1,
      fields: 'files(id, name)'
    });
    
    return {
      success: true,
      message: 'Successfully connected to Google Drive API',
      filesCount: response.data.files.length
    };
  } catch (error) {
    console.error('Google Drive connection test failed:', error);
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      error
    };
  }
};

// ダミーFirebase実装
export const dummyFirebase = {
  // Firestoreのダミー実装
  db: {
    collection: (collectionName) => ({
      doc: (docId) => ({
        get: async () => ({
          exists: false,
          data: () => ({}),
          id: docId
        }),
        set: async (data) => {
          console.log(`[Firebase Dummy] Setting document in ${collectionName}/${docId}:`, data);
          return { id: docId };
        },
        update: async (data) => {
          console.log(`[Firebase Dummy] Updating document in ${collectionName}/${docId}:`, data);
          return { id: docId };
        },
        delete: async () => {
          console.log(`[Firebase Dummy] Deleting document ${collectionName}/${docId}`);
          return true;
        }
      }),
      add: async (data) => {
        const id = nanoid();
        console.log(`[Firebase Dummy] Adding document to ${collectionName} with ID ${id}:`, data);
        return { id };
      },
      where: () => ({
        get: async () => ({
          empty: true,
          docs: [],
          forEach: () => {}
        }),
        orderBy: () => ({
          get: async () => ({
            empty: true,
            docs: [],
            forEach: () => {}
          })
        })
      }),
      orderBy: () => ({
        get: async () => ({
          empty: true,
          docs: [],
          forEach: () => {}
        })
      })
    })
  },
  // Authのダミー実装
  auth: {
    signInWithEmailAndPassword: async () => ({
      user: { uid: 'dummy-user-id', email: 'dummy@example.com' }
    }),
    createUserWithEmailAndPassword: async () => ({
      user: { uid: 'new-dummy-user-id', email: 'new-dummy@example.com' }
    }),
    signOut: async () => true
  }
};
