import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getStatusColor, CLIENT_STATUS, getNextStatus, validateClientData } from '../../lib/clients';

export default function ClientDetail({ clientId }) {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // クライアント情報取得
  useEffect(() => {
    async function fetchClientDetail() {
      if (!clientId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        
        if (!response.ok) {
          throw new Error('クライアント情報の取得に失敗しました');
        }
        
        const data = await response.json();
        setClient(data.client);
        setFormData(data.client);
        setError(null);
      } catch (err) {
        console.error('クライアント詳細取得エラー:', err);
        setError('クライアント情報の読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClientDetail();
  }, [clientId]);

  // フォーム入力ハンドラー
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // フォーム送信ハンドラー
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // バリデーション
    const errors = validateClientData(formData);
    if (errors) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clients/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          クライアントID: clientId,
          ...formData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'クライアント情報の更新に失敗しました');
      }
      
      // 成功したら編集モードを終了し、最新のデータを表示
      setClient(formData);
      setIsEditing(false);
      setFormErrors({});
    } catch (err) {
      console.error('更新エラー:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ステータス更新ハンドラー
  const handleStatusUpdate = async () => {
    if (!client) return;
    
    const newStatus = getNextStatus(client.ステータス);
    if (newStatus === client.ステータス) return;
    
    try {
      const response = await fetch('/api/clients/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          クライアントID: clientId,
          ステータス: newStatus
        }),
      });
      
      if (!response.ok) {
        throw new Error('ステータスの更新に失敗しました');
      }
      
      // 成功したら最新のデータを反映
      setClient({
        ...client,
        ステータス: newStatus
      });
      setFormData({
        ...formData,
        ステータス: newStatus
      });
      
    } catch (err) {
      console.error('ステータス更新エラー:', err);
      setError(err.message);
    }
  };

  // 削除ハンドラー
  const handleDelete = async () => {
    if (!window.confirm('このクライアントを削除してもよろしいですか？この操作は元に戻せません。')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/clients/delete?id=${clientId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('クライアントの削除に失敗しました');
      }
      
      // 削除成功後はクライアント一覧ページに戻る
      router.push('/clients');
      
    } catch (err) {
      console.error('削除エラー:', err);
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
        <div className="mt-4">
          <Link href="/clients" className="text-red-700 underline">
            クライアント一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        クライアント情報が見つかりません
        <div className="mt-4">
          <Link href="/clients" className="text-yellow-700 underline">
            クライアント一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{client.お名前}</h1>
          <p className="text-gray-600">{client['お名前　（カナ）']}</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.ステータス)}`}>
            {client.ステータス}
          </span>
          <button 
            onClick={() => handleStatusUpdate()}
            className="px-3 py-1 rounded-md text-sm font-medium bg-primary-100 text-primary-800 hover:bg-primary-200"
          >
            ステータス更新
          </button>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData(client);
                setFormErrors({});
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              削除
            </button>
            <Link
              href={`/sessions/new?clientId=${clientId}`}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              セッション作成
            </Link>
          </>
        )}
      </div>

      {/* クライアント情報 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isEditing ? (
          <form className="p-6 space-y-6">
            {/* フォームエラーメッセージ */}
            {Object.keys(formErrors).length > 0 && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <ul className="list-disc list-inside">
                  {Object.entries(formErrors).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="お名前" className="block text-sm font-medium text-gray-700">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="お名前"
                  name="お名前"
                  value={formData.お名前 || ''}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${formErrors.お名前 ? 'border-red-500' : ''}`}
                  required
                />
                {formErrors.お名前 && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.お名前}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="お名前　（カナ）" className="block text-sm font-medium text-gray-700">
                  お名前（カナ）
                </label>
                <input
                  type="text"
                  id="お名前　（カナ）"
                  name="お名前　（カナ）"
                  value={formData['お名前　（カナ）'] || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="メールアドレス" className="block text-sm font-medium text-gray-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="メールアドレス"
                  name="メールアドレス"
                  value={formData.メールアドレス || ''}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${formErrors.メールアドレス ? 'border-red-500' : ''}`}
                  required
                />
                {formErrors.メールアドレス && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.メールアドレス}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="電話番号　（ハイフンなし）" className="block text-sm font-medium text-gray-700">
                  電話番号（ハイフンなし）
                </label>
                <input
                  type="tel"
                  id="電話番号　（ハイフンなし）"
                  name="電話番号　（ハイフンなし）"
                  value={formData['電話番号　（ハイフンなし）'] || ''}
                  onChange={handleChange}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${formErrors['電話番号　（ハイフンなし）'] ? 'border-red-500' : ''}`}
                />
                {formErrors['電話番号　（ハイフンなし）'] && (
                  <p className="mt-1 text-sm text-red-500">{formErrors['電話番号　（ハイフンなし）']}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="性別" className="block text-sm font-medium text-gray-700">
                  性別
                </label>
                <select
                  id="性別"
                  name="性別"
                  value={formData.性別 || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">選択してください</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="その他">その他</option>
                  <option value="回答しない">回答しない</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="生年月日" className="block text-sm font-medium text-gray-700">
                  生年月日
                </label>
                <input
                  type="date"
                  id="生年月日"
                  name="生年月日"
                  value={formData.生年月日 || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="ご住所" className="block text-sm font-medium text-gray-700">
                  ご住所
                </label>
                <input
                  type="text"
                  id="ご住所"
                  name="ご住所"
                  value={formData.ご住所 || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="希望セッション形式" className="block text-sm font-medium text-gray-700">
                  希望セッション形式
                </label>
                <select
                  id="希望セッション形式"
                  name="希望セッション形式"
                  value={formData.希望セッション形式 || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">選択してください</option>
                  <option value="オンライン">オンライン</option>
                  <option value="対面">対面</option>
                  <option value="どちらでも可">どちらでも可</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="ステータス" className="block text-sm font-medium text-gray-700">
                  ステータス
                </label>
                <select
                  id="ステータス"
                  name="ステータス"
                  value={formData.ステータス || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value={CLIENT_STATUS.INQUIRY}>問合せ</option>
                  <option value={CLIENT_STATUS.TRIAL}>トライアル予約済</option>
                  <option value={CLIENT_STATUS.TRIAL_COMPLETED}>トライアル実施済</option>
                  <option value={CLIENT_STATUS.CONTINUING}>継続中</option>
                  <option value={CLIENT_STATUS.COMPLETED}>完了</option>
                  <option value={CLIENT_STATUS.DELETED}>削除済み</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="備考欄" className="block text-sm font-medium text-gray-700">
                  備考欄
                </label>
                <textarea
                  id="備考欄"
                  name="備考欄"
                  rows={4}
                  value={formData.備考欄 || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-gray-200">
            <dl className="divide-y divide-gray-200">
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">クライアントID</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.クライアントID}</dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">お名前</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.お名前}</dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">お名前（カナ）</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client['お名前　（カナ）'] || '-'}</dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.メールアドレス}</dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {client['電話番号　（ハイフンなし）'] || '-'}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">性別</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.性別 || '-'}</dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">生年月日</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.生年月日 || '-'}</dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">ご住所</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.ご住所 || '-'}</dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">希望セッション形式</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{client.希望セッション形式 || '-'}</dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">登録日時</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {client.タイムスタンプ ? new Date(client.タイムスタンプ).toLocaleString('ja-JP') : '-'}
                </dd>
              </div>
              <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">備考欄</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                  {client.備考欄 || '-'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
      
      {/* セッション履歴（将来実装） */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">セッション履歴</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">このクライアントのセッション履歴</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <p className="text-center text-gray-500">このセクションは開発中です</p>
        </div>
      </div>
    </div>
  );
}