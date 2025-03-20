/**
 * クライアントステータスに応じたカラークラスを取得する関数
 * @param {string} status - クライアントのステータス
 * @returns {string} Tailwind CSSのクラス名
 */
export function getStatusColor(status) {
  switch (status) {
    // 現在の定数値
    case '問い合わせ':
      return 'bg-yellow-100 text-yellow-800';
      
    case 'トライアル前':
      return 'bg-blue-100 text-blue-800';
      
    case 'トライアル済':
      return 'bg-indigo-100 text-indigo-800';
      
    case '契約中':
      return 'bg-green-100 text-green-800';
      
    case '完了':
      return 'bg-gray-100 text-gray-800';
      
    case '中断':
      return 'bg-red-100 text-red-800';
      
    // 旧定数値（互換性のため）
    case '問合せ':
      return 'bg-yellow-100 text-yellow-800';
      
    case 'トライアル予約済':
      return 'bg-blue-100 text-blue-800';
      
    case 'トライアル実施済':
      return 'bg-indigo-100 text-indigo-800';
      
    case '継続中':
      return 'bg-green-100 text-green-800';
      
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
      // ステータスの互換性を考慮したフィルタリング
      if (status === '問い合わせ' && client.ステータス === '問合せ') {
        return true;
      } else if (status === 'トライアル前' && client.ステータス === 'トライアル予約済') {
        return true;
      } else if (status === '契約中' && client.ステータス === '継続中') {
        return true;
      } else if (client.ステータス !== status) {
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

/**
 * クライアントデータを検証する関数
 * @param {Object} data - クライアントフォームデータ
 * @returns {Object|null} エラーがある場合はエラーオブジェクト、なければnull
 */
export function validateClientData(data) {
  const errors = {};
  
  // 必須フィールドの検証
  if (!data.お名前 || data.お名前.trim() === '') {
    errors.お名前 = 'お名前は必須です';
  }
  
  if (!data.メールアドレス || data.メールアドレス.trim() === '') {
    errors.メールアドレス = 'メールアドレスは必須です';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.メールアドレス)) {
    errors.メールアドレス = '有効なメールアドレスを入力してください';
  }
  
  // 電話番号のバリデーション（入力されている場合）
  if (data['電話番号　（ハイフンなし）'] && !/^[0-9]{10,11}$/.test(data['電話番号　（ハイフンなし）'])) {
    errors['電話番号　（ハイフンなし）'] = '電話番号は10〜11桁の数字で入力してください';
  }
  
  // 日付のバリデーション（入力されている場合）
  if (data.生年月日) {
    const date = new Date(data.生年月日);
    if (isNaN(date.getTime())) {
      errors.生年月日 = '有効な日付を入力してください';
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
}