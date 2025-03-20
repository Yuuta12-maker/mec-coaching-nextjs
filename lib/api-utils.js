/**
 * ブラウザとサーバーで共通して使える関数
 * このファイルにはNode.js固有のモジュールを使用しないこと
 */

// API経由でデータを取得する関数
export async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`/api/${endpoint}`, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API呼び出しエラー: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`APIエラー (${endpoint}):`, error);
    throw error;
  }
}

// クライアントデータを取得する関数
export async function getClients() {
  const response = await fetchData('clients');
  return response.clients || [];
}

// 特定のクライアントを取得する関数
export async function getClient(id, options = {}) {
  const queryParams = new URLSearchParams();
  
  if (options.withSessions) {
    queryParams.append('withSessions', 'true');
  }
  
  if (options.withPayments) {
    queryParams.append('withPayments', 'true');
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchData(`clients/${id}${queryString}`);
}

// セッションデータを取得する関数
export async function getSessions() {
  const response = await fetchData('sessions');
  return response.sessions || [];
}

// 支払いデータを取得する関数
export async function getPayments() {
  const response = await fetchData('payments');
  return response.payments || [];
}

// 支払いを作成する関数
export async function createPayment(data) {
  return fetchData('payments/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

// 支払いを更新する関数
export async function updatePayment(data) {
  return fetchData('payments/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

// 入金確認する関数
export async function confirmPayment(paymentId, paymentDate = null) {
  return fetchData('payments/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      支払いID: paymentId,
      入金日: paymentDate || new Date().toISOString().split('T')[0]
    }),
  });
}

// 日付のフォーマット関数
export function formatDate(dateString, options = {}) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  });
}

// 金額のフォーマット関数
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '0円';
  return `${Number(amount).toLocaleString()}円`;
}

// ステータスに応じたカラークラスを返す関数
export function getStatusColorClass(status) {
  switch (status) {
    case '入金済':
    case '入金済み': // 互換性のために両方サポート
      return 'bg-green-100 text-green-800';
    case '未入金':
    case '未払い': // 互換性のために両方サポート
      return 'bg-red-100 text-red-800';
    case '予定':
      return 'bg-blue-100 text-blue-800';
    case '実施済':
      return 'bg-green-100 text-green-800';
    case 'キャンセル':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}