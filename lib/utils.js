/**
 * 日付をフォーマットする関数
 * @param {string|Date} date - フォーマットする日付（文字列またはDateオブジェクト）
 * @param {string} format - フォーマット文字列
 * format例: 'yyyy/MM/dd HH:mm:ss'
 * y: 年, M: 月, d: 日, H: 時, m: 分, s: 秒
 * @returns {string} フォーマットされた日付文字列
 */
export function formatDate(date, format = 'yyyy/MM/dd') {
  if (!date) return '';
  
  const targetDate = date instanceof Date ? date : new Date(date);
  
  // 不正な日付の場合
  if (isNaN(targetDate.getTime())) {
    return 'Invalid Date';
  }
  
  // 各部分を取得
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const seconds = targetDate.getSeconds();
  
  // フォーマット文字列を置換
  return format
    .replace(/yyyy/g, year.toString())
    .replace(/yy/g, (year % 100).toString().padStart(2, '0'))
    .replace(/MM/g, month.toString().padStart(2, '0'))
    .replace(/M/g, month.toString())
    .replace(/dd/g, day.toString().padStart(2, '0'))
    .replace(/d/g, day.toString())
    .replace(/HH/g, hours.toString().padStart(2, '0'))
    .replace(/H/g, hours.toString())
    .replace(/mm/g, minutes.toString().padStart(2, '0'))
    .replace(/m/g, minutes.toString())
    .replace(/ss/g, seconds.toString().padStart(2, '0'))
    .replace(/s/g, seconds.toString());
}

/**
 * 金額を通貨形式にフォーマットする関数
 * @param {number|string} amount - フォーマットする金額
 * @param {string} currency - 通貨記号（デフォルトは'¥'）
 * @returns {string} フォーマットされた金額文字列
 */
export function formatCurrency(amount, currency = '¥') {
  // console.log('金額フォーマット前:', amount, typeof amount);
  
  // 文字列の場合も処理できるようにする
  let numAmount = amount;
  
  // 文字列や不正な値をチェック
  if (typeof amount === 'string') {
    // "214000"のように数字の文字列ならパース
    if (/^\d+$/.test(amount)) {
      numAmount = parseInt(amount, 10);
    } 
    // "Invalid Amount"などの場合はそのまま返す
    else if (amount === "Invalid Amount" || amount === "" || amount === null || amount === undefined) {
      return `${currency}0`;
    }
    // それ以外の不正な文字列
    else {
      return `${currency}0`;
    }
  }
  
  // 数値でない場合は0として扱う
  if (typeof numAmount !== 'number' || isNaN(numAmount)) {
    return `${currency}0`;
  }
  
  // 3桁ごとにカンマを挿入
  return `${currency}${numAmount.toLocaleString('ja-JP')}`;
}

/**
 * 電話番号をフォーマットする関数
 * @param {string} phoneNumber - フォーマットする電話番号（ハイフンなし）
 * @returns {string} フォーマットされた電話番号
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // 数字以外の文字を除去
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // 桁数に応じたフォーマット
  if (cleanNumber.length === 11) {
    // 携帯電話番号（090-xxxx-xxxx）
    return cleanNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (cleanNumber.length === 10) {
    // 固定電話（03-xxxx-xxxx）
    return cleanNumber.replace(/(\d{2,4})(\d{2,4})(\d{4})/, '$1-$2-$3');
  } else {
    // その他の形式はそのまま返す
    return phoneNumber;
  }
}

/**
 * ランダムIDを生成する関数
 * @param {string} prefix - IDのプレフィックス
 * @returns {string} ランダムID
 */
export function generateId(prefix = '') {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}${random}`;
}

/**
 * 指定された日付が今日かどうかを判定する関数
 * @param {string|Date} date - 判定する日付
 * @returns {boolean} 今日ならtrue、それ以外はfalse
 */
export function isToday(date) {
  if (!date) return false;
  
  const targetDate = date instanceof Date ? date : new Date(date);
  const today = new Date();
  
  return (
    targetDate.getDate() === today.getDate() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getFullYear() === today.getFullYear()
  );
}
