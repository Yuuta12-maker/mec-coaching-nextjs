import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import { validateClientData } from '../../lib/clients';

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    お名前: '',
    'お名前　（カナ）': '',
    メールアドレス: '',
    '電話番号　（ハイフンなし）': '',
    性別: '',
    生年月日: '',
    ご住所: '',
    希望セッション形式: '',
    備考欄: '',
    ステータス: '問合せ'
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
      const response = await fetch('/api/clients/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'クライアントの登録に失敗しました');
      }
      
      // 成功したらクライアント詳細ページにリダイレクト
      router.push(`/clients/${data.client.クライアントID}`);
      
    } catch (err) {
      console.error('クライアント登録エラー:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>新規クライアント登録 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="mb-6">
        <div className="flex items-center space-x-2">
          <Link href="/clients" className="text-primary-600 hover:text-primary-800">
            クライアント一覧
          </Link>
          <span className="text-gray-500">/</span>
          <span className="text-gray-700">新規登録</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">新規クライアント登録</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
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
                value={formData.お名前}
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
                value={formData['お名前　（カナ）']}
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
                value={formData.メールアドレス}
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
                value={formData['電話番号　（ハイフンなし）']}
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
                value={formData.性別}
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
                value={formData.生年月日}
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
                value={formData.ご住所}
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
                value={formData.希望セッション形式}
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
                value={formData.ステータス}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="問合せ">問合せ</option>
                <option value="トライアル予約済">トライアル予約済</option>
                <option value="トライアル実施済">トライアル実施済</option>
                <option value="継続中">継続中</option>
                <option value="完了">完了</option>
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
                value={formData.備考欄}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Link
              href="/clients"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? '登録中...' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

// サーバーサイドで認証を確認
export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/clients/new',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
}