import { google } from 'googleapis';

// スプレッドシートIDと設定
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '14f2qTCFo4Ik92lIKm9UVcg95wMuKRZYD-Kyx-RHpaUQ';
const SHEET_NAMES = {
  CLIENT: 'クライアントinfo',
  SESSION: 'セッション管理',
  PAYMENT: '支払い管理',
  EMAIL_LOG: 'メールログ',
  SETTINGS: '設定'
};

// Google Sheets APIへの認証設定
async function getAuthClient() {
  try {
    // サービスアカウントの認証情報
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    return auth;
  } catch (error) {
    console.error('認証エラー:', error);
    throw new Error('Google APIの認証に失敗しました');
  }
}

// スプレッドシートからデータを取得する関数
export async function getSheetData(sheetName) {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // シートからデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:Z`,
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) {
      return [];
    }
    
    // ヘッダー行（1行目）を取得
    const headers = rows[0];
    
    // ヘッダーとデータを組み合わせてオブジェクトの配列を作成（2行目以降がデータ）
    return rows.slice(1).map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index] || '';
      });
      return item;
    });
    
  } catch (error) {
    console.error(`シート「${sheetName}」のデータ取得エラー:`, error);
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
    console.error(`ID「${id}」の検索エラー:`, error);
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
    const values = headers.map(header => data[header] || '');
    
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
    console.error(`データ追加エラー:`, error);
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
    const values = headers.map(header => updatedData[header] !== undefined ? updatedData[header] : '');
    
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
    console.error(`データ更新エラー:`, error);
    throw new Error(`データの更新に失敗しました: ${error.message}`);
  }
}

// エクスポートする定数
export const config = {
  SPREADSHEET_ID,
  SHEET_NAMES
};