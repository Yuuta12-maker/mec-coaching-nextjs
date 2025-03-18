/**
 * クライアントステータスに応じたカラークラスを取得する関数
 * @param {string} status - クライアントのステータス
 * @returns {string} Tailwind CSSのクラス名
 */
export function getStatusColor(status) {
  switch (status) {
    case '問合せ':
      return 'bg-yellow-100 text-yellow-800';
    case 'トライアル予約済':
      return 'bg-blue-100 text-blue-800';
    case 'トライアル実施済':
      return 'bg-indigo-100 text-indigo-800';
    case '継続中':
      return 'bg-green-100 text-green-800';
    case '完了':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

/**
 * クライアントタイプに応じたラベルとカラーを取得する関数
 * @param {string} type - クライアントのタイプまたはプラン
 * @returns {Object} ラベルとカラークラスを含むオブジェクト
 */
export function getClientTypeInfo(type) {
  switch (type) {
    case 'トライアル':
      return {
        label: 'トライアル',
        color: 'bg-blue-100 text-blue-800'
      };
    case '継続':
      return {
        label: '継続',
        color: 'bg-green-100 text-green-800'
      };
    case 'カスタム':
      return {
        label: 'カスタム',
        color: 'bg-purple-100 text-purple-800'
      };
    default:
      return {
        label: '未設定',
        color: 'bg-gray-100 text-gray-500'
      };
  }
}

/**
 * クライアント一覧の検索およびフィルター関数
 * @param {Array} clients - クライアントデータの配列
 * @param {Object} filters - 検索条件のオブジェクト
 * @returns {Array} フィルタリングされたクライアント配列
 */
export function filterClients(clients, filters) {
  if (!clients || !Array.isArray(clients)) {
    return [];
  }
  
  const { search, status, sessionFormat } = filters || {};
  
  return clients.filter(client => {
    // 検索キーワードでフィルタリング
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      const nameMatch = client.お名前 && client.お名前.toLowerCase().includes(searchLower);
      const kanaMatch = client['お名前　（カナ）'] && client['お名前　（カナ）'].toLowerCase().includes(searchLower);
      const emailMatch = client.メールアドレス && client.メールアドレス.toLowerCase().includes(searchLower);
      
      if (!(nameMatch || kanaMatch || emailMatch)) {
        return false;
      }
    }
    
    // ステータスでフィルタリング
    if (status && status !== 'all') {
      if (client.ステータス !== status) {
        return false;
      }
    }
    
    // セッション形式でフィルタリング
    if (sessionFormat && sessionFormat !== 'all') {
      if (client.希望セッション形式 !== sessionFormat) {
        return false;
      }
    }
    
    // すべての条件を満たす場合
    return true;
  });
}

/**
 * クライアントデータのソート関数
 * @param {Array} clients - クライアントデータの配列
 * @param {string} sortBy - ソートするフィールド
 * @param {string} sortOrder - ソート順序 ('asc' または 'desc')
 * @returns {Array} ソートされたクライアント配列
 */
export function sortClients(clients, sortBy = 'タイムスタンプ', sortOrder = 'desc') {
  if (!clients || !Array.isArray(clients)) {
    return [];
  }
  
  return [...clients].sort((a, b) => {
    let valueA = a[sortBy];
    let valueB = b[sortBy];
    
    // 日付フィールドの場合、Dateオブジェクトに変換
    if (sortBy === 'タイムスタンプ' || sortBy === '生年月日' || sortBy.includes('日時')) {
      valueA = valueA ? new Date(valueA) : new Date(0);
      valueB = valueB ? new Date(valueB) : new Date(0);
    }
    
    // 数値フィールドの場合、数値に変換
    if (typeof valueA === 'string' && !isNaN(valueA)) {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }
    
    // 文字列の場合、ロケール考慮の比較
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      const result = valueA.localeCompare(valueB, 'ja');
      return sortOrder === 'asc' ? result : -result;
    }
    
    // その他の値はデフォルト比較
    if (sortOrder === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });
}