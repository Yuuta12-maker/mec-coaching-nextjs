import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useForm } from 'react-hook-form';

export default function NewSessionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { clientId } = router.query; // URL クエリからクライアントIDを取得
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      クライアントID: clientId || '',
      予定日時: '',
      セッション種別: '',
      ステータス: '予定',
      メモ: ''
    }
  });
  
  // 選択中のクライアントID
  const watchedClientId = watch('クライアントID');
  
  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/sessions/new');
    }
  }, [status, router]);
  
  // クライアント一覧を取得
  useEffect(() => {
    async function fetchClients() {
      try {
        setError(null);
        const response = await fetch('/api/clients');
        
        if (!response.ok) {
          throw new Error('クライアント情報の取得に失敗しました');
        }
        
        const data = await response.json();
        setClients(data.clients || []);
      } catch (err) {
        console.error('クライアント取得エラー:', err);
        setError('クライアント情報の読み込みに失敗しました: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchClients();
  }, []);
  
  // URLクエリからクライアントIDが渡された場合、フォームに設定
  useEffect(() => {
    if (clientId) {
      setValue('クライアントID', clientId);
    }
  }, [clientId, setValue]);
  
  // 選択中のクライアント情報を更新
  useEffect(() => {
    if (watchedClientId && clients.length > 0) {
      const client = clients.find(c => c.クライアントID === watchedClientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [watchedClientId, clients]);
  
  // セッション登録処理
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);
      
      // 日時のフォーマット調整
      if (data.予定日時) {
        data.予定日時 = new Date(data.予定日時).toISOString();
      }
      
      // APIリクエスト
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '登録に失敗しました');
      }
      
      // 登録成功
      const result = await response.json();
      alert('セッションを登録しました');
      
      // セッション詳細ページへリダイレクト
      router.push(`/sessions/${result.sessionId}`);
    } catch (err) {
      console.error('セッション登録エラー:', err);
      setError(err.message || '登録中にエラーが発生しました');
      window.scrollTo(0, 0); // エラーメッセージが見えるようにスクロール
    } finally {
      setSubmitting(false);
    }
  };
  
  // 現在時刻から30分単位に切り上げた時間を取得（デフォルト値用）
  const getDefaultDateTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    // YYYY-MM-DDThh:mm 形式にフォーマット
    return now.toISOString().slice(0, 16);
  };
  
  return (
    <Layout>
      <Head>
        <title>新規セッション登録 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      {/* ヘッダー部分 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/sessions" className="text-[#c50502] hover:underline">
            セッション一覧
          </Link>
          <span className="text-gray-500">&gt;</span>
          <h1 className="text-xl font-bold text-gray-800">
            新規セッション登録
          </h1>
        </div>
        <p className="text-gray-600">
          新しいセッションを予約します
        </p>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* 登録フォーム */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* クライアント選択 */}
              <div>
                <label
                  htmlFor="clientId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  クライアント <span className="text-red-500">*</span>
                </label>
                <select
                  id="clientId"
                  {...register('クライアントID', {
                    required: 'クライアントを選択してください'
                  })}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502] ${
                    errors.クライアントID ? 'border-red-300' : ''
                  }`}
                  disabled={loading}
                >
                  <option value="">選択してください</option>
                  {clients.map((client) => (
                    <option key={client.クライアントID} value={client.クライアントID}>
                      {client.お名前} {client['お名前　（カナ）'] ? `(${client['お名前　（カナ）']})` : ''}
                    </option>
                  ))}
                </select>
                {errors.クライアントID && (
                  <p className="mt-1 text-sm text-red-600">{errors.クライアントID.message}</p>
                )}
                {loading && (
                  <p className="mt-1 text-sm text-gray-500">クライアント情報を読み込み中...</p>
                )}
              </div>
              
              {/* 選択されたクライアント情報 */}
              {selectedClient && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">クライアント情報</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">メール:</span>{' '}
                      {selectedClient.メールアドレス}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">希望形式:</span>{' '}
                      {selectedClient.希望セッション形式 || '未設定'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">ステータス:</span>{' '}
                      <span className={`px-2 py-0.5 text-xs rounded-full 
                        ${selectedClient.ステータス === '継続中' ? 'bg-green-100 text-green-800' : 
                          selectedClient.ステータス === 'トライアル実施済' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {selectedClient.ステータス || '未設定'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
              
              {/* セッション種別 */}
              <div>
                <label
                  htmlFor="sessionType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  セッション種別 <span className="text-red-500">*</span>
                </label>
                <select
                  id="sessionType"
                  {...register('セッション種別', { required: 'セッション種別は必須です' })}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502] ${
                    errors.セッション種別 ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">選択してください</option>
                  <option value="トライアル">トライアル</option>
                  <option value="継続1">継続1</option>
                  <option value="継続2">継続2</option>
                  <option value="継続3">継続3</option>
                  <option value="継続4">継続4</option>
                  <option value="継続5">継続5</option>
                  <option value="カスタム">カスタム</option>
                </select>
                {errors.セッション種別 && (
                  <p className="mt-1 text-sm text-red-600">{errors.セッション種別.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              {/* 予定日時 */}
              <div>
                <label
                  htmlFor="scheduledTime"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  予定日時 <span className="text-red-500">*</span>
                </label>
                <input
                  id="scheduledTime"
                  type="datetime-local"
                  {...register('予定日時', { required: '予定日時は必須です' })}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502] ${
                    errors.予定日時 ? 'border-red-300' : ''
                  }`}
                  defaultValue={getDefaultDateTime()}
                />
                {errors.予定日時 && (
                  <p className="mt-1 text-sm text-red-600">{errors.予定日時.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">※ 日本時間で入力してください</p>
              </div>
              
              {/* ステータス */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ステータス
                </label>
                <select
                  id="status"
                  {...register('ステータス')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
                >
                  <option value="予定">予定</option>
                  <option value="実施済み">実施済み</option>
                  <option value="キャンセル">キャンセル</option>
                </select>
              </div>
              
              {/* メモ */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  セッションメモ
                </label>
                <textarea
                  id="notes"
                  rows={5}
                  {...register('メモ')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
                  placeholder="セッションに関するメモや備考を入力してください"
                />
              </div>
            </div>
          </div>
          
          {/* フォームボタン */}
          <div className="mt-8 flex justify-end space-x-3">
            <Link
              href="/sessions"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#c50502] hover:bg-[#a00401]"
              disabled={submitting}
            >
              {submitting ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}