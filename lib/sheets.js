import { google } from 'googleapis';
import logger from './logger';

// スプレッドシートIDと設定
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '14f2qTCFo4Ik92lIKm9UVcg95wMuKRZYD-Kyx-RHpaUQ';
const SHEET_NAMES = {
  CLIENT: 'クライアントinfo',
  SESSION: 'セッション管理',
  PAYMENT: '支払い管理',
  EMAIL_LOG: 'メールログ',
  SETTINGS: '設定'
};

// 数値型を期待するカラム
const NUMERIC_COLUMNS = ['金額', '総額', 'トライアル料金', '継続セッション料金'];

// Google Sheets APIへの認証設定
async function getAuthClient() {
  try {
    // サービスアカウントのキーを取得
    const serviceAccountKeyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKeyStr) {
      logger.error('環境変数が設定されていません: GOOGLE_SERVICE_ACCOUNT_KEY');
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY 環境変数が設定されていません');
    }
    
    // JSONパースを試みる前にログ出力（デバッグ用）
    logger.debug(`サービスアカウントキーの長さ: ${serviceAccountKeyStr.length}`);
    logger.debug(`サービスアカウントキーの先頭: ${serviceAccountKeyStr.substring(0, 20)}...`);
    
    let parsedKey;
    try {
      parsedKey = JSON.parse(serviceAccountKeyStr);
    } catch (parseError) {
      logger.error('JSONパースエラー:', parseError);
      throw new Error(`サービスアカウントキーのJSONパースに失敗しました: ${parseError.message}`);
    }
    
    // 必須フィールドの確認
    if (!parsedKey.client_email) {
      logger.error('client_emailフィールドがありません');
      throw new Error('サービスアカウントキーに client_email フィールドが含まれていません');
    }
    
    if (!parsedKey.private_key) {
      logger.error('private_keyフィールドがありません');
      throw new Error('サービスアカウントキーに private_key フィールドが含まれていません');
    }
    
    logger.info(`認証に使用するclient_email: ${parsedKey.client_email}`);
    logger.debug(`スプレッドシートID: ${SPREADSHEET_ID}`);
    
    // サービスアカウントの認証情報を使用
    const auth = new google.auth.GoogleAuth({
      credentials: parsedKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    return auth;
  } catch (error) {
    logger.error('認証エラーの詳細:', error);
    throw new Error(`Google APIの認証に失敗しました: ${error.message}`);
  }
}

/**
 * セルの値を適切な型に変換する補助関数
 * @param {any} value - 変換する値
 * @param {string} header - カラム名
 * @returns {any} 変換された値
 */
function processValue(value, header) {
  // undefinedや空文字の場合はそのまま返す
  if (value === undefined || value === '') {
    return '';
  }
  
  // 数値型への変換を試みるカラム
  if (NUMERIC_COLUMNS.includes(header)) {
    // カンマや円記号を取り除く
    const cleanedValue = String(value).replace(/[^0-9.-]/g, '');
    const numeric = parseFloat(cleanedValue);
    
    // 有効な数値に変換できれば数値型で返す
    if (!isNaN(numeric)) {
      return numeric;
    }
    
    // 変換できない場合はログ出力
    logger.warn(`数値変換に失敗: ${header}=${value}`);
    return 0; // デフォルト値を設定
  }
  
  // その他のカラムはそのまま返す
  return value;
}

// スプレッドシートからデータを取得する関数
export async function getSheetData(sheetName) {
  try {
    logger.info(`シート「${sheetName}」のデータ取得を開始`);
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // シートからデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z`,
    });
    
    const rows = response.data.values || [];
    logger.info(`シート「${sheetName}」から ${rows.length} 行のデータを取得`);
    
    if (rows.length === 0) {
      return [];
    }
    
    // ヘッダー行（1行目）を取得
    const headers = rows[0];
    logger.debug(`ヘッダー: ${headers.join(', ')}`);
    
    // ヘッダーとデータを組み合わせてオブジェクトの配列を作成（2行目以降がデータ）
    return rows.slice(1).map(row => {
      const item = {};
      headers.forEach((header, index) => {
        // 値の型変換処理を追加
        item[header] = processValue(row[index], header);
      });
      return item;
    });
    
  } catch (error) {
    logger.error(`シート「${sheetName}」のデータ取得エラー:`, error);
    throw new Error(`スプレッドシートからのデータ取得に失敗しました: ${error.message}`);
  }
}

// IDでレコードを検索する関数
export async function findRowById(sheetName, id, idColumnName = null) {
  try {
    const data = await getSheetData(sheetName);
    
    // ID列の名前を決定
    let idColumn = idColumnName;
    if (!idColumn) {
      // シート名に基づいて一般的なID列を推測
      if (sheetName.includes('クライアント')) {
        idColumn = 'クライアントID';
      } else if (sheetName.includes('セッション')) {
        idColumn = 'セッションID';
      } else if (sheetName.includes('支払い')) {
        idColumn = '支払いID';
      } else {
        // デフォルトは「ID」列を探す
        for (const key of Object.keys(data[0] || {})) {
          if (key && key.includes('ID')) {
            idColumn = key;
            break;
          }
        }
      }
    }
    
    if (!idColumn) {
      throw new Error('適切なID列が見つかりませんでした');
    }
    
    // IDで検索
    return data.find(row => row[idColumn] === id) || null;
    
  } catch (error) {
    logger.error(`ID「${id}」の検索エラー:`, error);
    throw new Error(`ID「${id}」の検索に失敗しました: ${error.message}`);
  }
}

// スプレッドシートにデータを追加する関数
export async function addRow(sheetName, data) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // まず既存のデータのヘッダー行を取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1`,
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      throw new Error('ヘッダー行が見つかりません');
    }
    
    const headers = response.data.values[0];
    
    // データをヘッダーの順に配列にする
    const values = headers.map(header => {
      const value = data[header];
      
      // 数値型の場合、スプレッドシートに保存する前に文字列に変換
      if (typeof value === 'number') {
        return value.toString();
      }
      
      return value || '';
    });
    
    // データを追加
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [values],
      },
    });
    
    return { success: true, message: 'データを追加しました' };
    
  } catch (error) {
    logger.error(`データ追加エラー:`, error);
    throw new Error(`データの追加に失敗しました: ${error.message}`);
  }
}

// スプレッドシートのデータを更新する関数
export async function updateRowById(sheetName, id, data, idColumnName = null) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // まず既存のデータを取得
    const allData = await getSheetData(sheetName);
    
    // ID列の名前を決定
    let idColumn = idColumnName;
    if (!idColumn) {
      if (sheetName.includes('クライアント')) {
        idColumn = 'クライアントID';
      } else if (sheetName.includes('セッション')) {
        idColumn = 'セッションID';
      } else if (sheetName.includes('支払い')) {
        idColumn = '支払いID';
      } else {
        // デフォルトは「ID」列を探す
        for (const key of Object.keys(allData[0] || {})) {
          if (key && key.includes('ID')) {
            idColumn = key;
            break;
          }
        }
      }
    }
    
    if (!idColumn) {
      throw new Error('適切なID列が見つかりませんでした');
    }
    
    // IDで検索して行番号を特定
    const rowIndex = allData.findIndex(row => row[idColumn] === id);
    if (rowIndex === -1) {
      throw new Error(`ID「${id}」のレコードが見つかりません`);
    }
    
    // ヘッダーを取得
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z1`,
    });
    const headers = headerResponse.data.values[0];
    
    // 現在のデータと更新データをマージ
    const currentData = allData[rowIndex];
    const updatedData = { ...currentData, ...data };
    
    // データをヘッダーの順に配列にする
    const values = headers.map(header => {
      const value = updatedData[header];
      
      // 数値型の場合、スプレッドシートに保存する前に文字列に変換
      if (typeof value === 'number') {
        return value.toString();
      }
      
      // undefinedの場合は空文字を設定
      return value !== undefined ? value : '';
    });
    
    // データを更新（2行目からデータが始まるため、行番号は rowIndex + 2）
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex + 2}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [values],
      },
    });
    
    return { success: true, message: `ID「${id}」のレコードを更新しました` };
    
  } catch (error) {
    logger.error(`データ更新エラー:`, error);
    throw new Error(`データの更新に失敗しました: ${error.message}`);
  }
}

// スプレッドシートの接続テスト関数
export async function testConnection() {
  try {
    logger.info('スプレッドシート接続テストを開始');
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // スプレッドシートのメタデータを取得
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    logger.info(`スプレッドシート接続成功: "${response.data.properties.title}"`);
    return {
      success: true,
      spreadsheetTitle: response.data.properties.title,
      message: 'スプレッドシートへの接続に成功しました',
    };
  } catch (error) {
    logger.error('スプレッドシート接続テストエラー:', error);
    throw new Error(`スプレッドシートへの接続テストに失敗しました: ${error.message}`);
  }
}

// エクスポートする定数
export const config = {
  SPREADSHEET_ID,
  SHEET_NAMES
};