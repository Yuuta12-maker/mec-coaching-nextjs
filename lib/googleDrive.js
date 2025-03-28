import { google } from 'googleapis';

// サービスアカウント認証情報を環境変数から取得
const CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  : null;

// 領収書保存用のGoogle DriveフォルダID
const RECEIPTS_FOLDER_ID = process.env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID;

/**
 * Google Drive APIのauthクライアントを初期化
 * @returns {google.auth.JWT} 認証済みJWTクライアント
 */
const getAuthClient = () => {
  if (!CREDENTIALS) {
    throw new Error('Google Service Account credentials are not configured');
  }

  const client = new google.auth.JWT(
    CREDENTIALS.client_email,
    null,
    CREDENTIALS.private_key,
    ['https://www.googleapis.com/auth/drive.file']
  );

  return client;
};

/**
 * Google Drive APIクライアントを初期化
 * @returns {google.drive_v3.Drive} Drive APIクライアント
 */
const getDriveClient = () => {
  const authClient = getAuthClient();
  return google.drive({ version: 'v3', auth: authClient });
};

/**
 * JSONデータをGoogle Driveに保存
 * @param {string} fileName ファイル名（拡張子なし）
 * @param {object} data 保存するJSONデータ
 * @param {string} [fileId] 既存ファイルのID（更新の場合）
 * @returns {Promise<string>} 保存したファイルのID
 */
export const saveJsonToGoogleDrive = async (fileName, data, fileId = null) => {
  try {
    const drive = getDriveClient();
    const fileMetadata = {
      name: `${fileName}.json`,
      mimeType: 'application/json',
    };
    
    if (!fileId) {
      // フォルダIDが指定されている場合は、そのフォルダ内に保存
      if (RECEIPTS_FOLDER_ID) {
        fileMetadata.parents = [RECEIPTS_FOLDER_ID];
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
 * @param {string} [folderId] 検索対象のフォルダID（デフォルトは領収書フォルダ）
 * @returns {Promise<Array>} ファイル情報の配列
 */
export const listJsonFilesInFolder = async (folderId = RECEIPTS_FOLDER_ID) => {
  try {
    const drive = getDriveClient();
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
 * 領収書データを取得（すべてのJSONファイルを取得して結合）
 * @returns {Promise<Array>} すべての領収書データの配列
 */
export const getAllReceiptsData = async () => {
  try {
    // フォルダ内のすべてのJSONファイルをリスト
    const files = await listJsonFilesInFolder();
    
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
    throw error;
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
    await drive.files.delete({
      fileId
    });
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw error;
  }
};
