import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getSheetData, config } from '../../lib/sheets';

export default function NewPayment({ clientsData }) {
  const router = useRouter();
  const { clientId } = router.query; // URLからクライアントIDを取得
  const [clients, setClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // react-hook-formの設定
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      項目: 'トライアルセッション',
      金額: 6000,
      状態: '未入金',
      登録日: new Date().toISOString().split('T')[0]
    }
  });
  
  // 選択された項目に基づいて金額を自動設定
  const selectedItem = watch('項目');
  
  useEffect(() => {
    // 項目に基づいて金額を自動設定
    if (selectedItem === 'トライアルセッション') {
      reset({ ...watch(), 金額: 6000 });
    } else if (selectedItem === '継続セッション') {
      reset({ ...watch(), 金額: 214000 });
    }
  }, [selectedItem, reset, watch]);
  
  useEffect(() => {
    if (clientsData) {
      setClients(clientsData);
    }
    
    // URLパラメータでクライアントIDが指定されていれば自動選択
    if (clientId) {
      setValue('クライアントID', clientId);
    }
  }, [clientsData, clientId, setValue]);

  // フォーム送信処理
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 支払いIDを生成
      const paymentId = `payment_${Date.now()}`;
      
      // APIエンドポイントへデータを送信
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          支払いID: paymentId,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '支払い情報の登録に失敗しました');
      }
      
      // 成功した場合、支払い一覧ページにリダイレクト
      router.push('/payments');
      
    } catch (err) {
      console.error('エラー:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>新規支払い登録 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="page-title">新規支払い登録</h1>
            <p className="page-description">新しい支払い情報を登録します</p>
          </div>
          <div className="mt-3 sm:mt-0">
            <Link href="/payments" className="btn btn-outline">
              <span className="material-icons mr-1">arrow_back</span>
              支払い一覧に戻る
            </Link>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">支払い情報入力</h2>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
            <p className="flex items-center">
              <span className="material-icons mr-2 text-red-500">error</span>
              {error}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* クライアント選択 */}
          <div className="form-group">
            <label htmlFor="clientId" className="form-label">クライアント <span className="text-red-500">*</span></label>
            <select
              id="clientId"
              className={`form-select ${errors.クライアントID ? 'border-red-500' : ''}`}
              {...register('クライアントID', { required: 'クライアントを選択してください' })}
            >
              <option value="">クライアントを選択...</option>
              {clients.map((client) => (
                <option key={client.クライアントID} value={client.クライアントID}>
                  {client.お名前}
                </option>
              ))}
            </select>
            {errors.クライアントID && (
              <p className="mt-1 text-sm text-red-600">{errors.クライアントID.message}</p>
            )}
          </div>
          
          {/* 項目 */}
          <div className="form-group">
            <label htmlFor="item" className="form-label">項目 <span className="text-red-500">*</span></label>
            <select
              id="item"
              className={`form-select ${errors.項目 ? 'border-red-500' : ''}`}
              {...register('項目', { required: '項目を選択してください' })}
            >
              <option value="トライアルセッション">トライアルセッション</option>
              <option value="継続セッション">継続セッション</option>
              <option value="その他">その他</option>
            </select>
            {errors.項目 && (
              <p className="mt-1 text-sm text-red-600">{errors.項目.message}</p>
            )}
          </div>
          
          {/* 金額 */}
          <div className="form-group">
            <label htmlFor="amount" className="form-label">金額 (円) <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="amount"
              className={`form-input ${errors.金額 ? 'border-red-500' : ''}`}
              {...register('金額', { 
                required: '金額を入力してください',
                min: { value: 1, message: '金額は1円以上で入力してください' }
              })}
            />
            {errors.金額 && (
              <p className="mt-1 text-sm text-red-600">{errors.金額.message}</p>
            )}
          </div>
          
          {/* 状態 */}
          <div className="form-group">
            <label className="form-label">状態 <span className="text-red-500">*</span></label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  value="未入金"
                  {...register('状態', { required: '状態を選択してください' })}
                />
                <span className="ml-2">未入金</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  value="入金済み"
                  {...register('状態', { required: '状態を選択してください' })}
                />
                <span className="ml-2">入金済み</span>
              </label>
            </div>
            {errors.状態 && (
              <p className="mt-1 text-sm text-red-600">{errors.状態.message}</p>
            )}
          </div>
          
          {/* 登録日 */}
          <div className="form-group">
            <label htmlFor="registerDate" className="form-label">登録日 <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="registerDate"
              className={`form-input ${errors.登録日 ? 'border-red-500' : ''}`}
              {...register('登録日', { required: '登録日を入力してください' })}
            />
            {errors.登録日 && (
              <p className="mt-1 text-sm text-red-600">{errors.登録日.message}</p>
            )}
          </div>
          
          {/* 入金日（状態が入金済みの場合のみ表示） */}
          {watch('状態') === '入金済み' && (
            <div className="form-group">
              <label htmlFor="paidDate" className="form-label">入金日 <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="paidDate"
                className={`form-input ${errors.入金日 ? 'border-red-500' : ''}`}
                {...register('入金日', {
                  required: '入金済みの場合は入金日を入力してください'
                })}
              />
              {errors.入金日 && (
                <p className="mt-1 text-sm text-red-600">{errors.入金日.message}</p>
              )}
            </div>
          )}
          
          {/* 備考 */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">備考</label>
            <textarea
              id="notes"
              className="form-textarea"
              rows="3"
              {...register('備考')}
            ></textarea>
          </div>
          
          {/* 送信ボタン */}
          <div className="flex justify-end space-x-3 border-t border-gray-100 pt-6">
            <Link href="/payments" className="btn btn-outline">
              キャンセル
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner-sm mr-2"></div>
                  保存中...
                </>
              ) : (
                '保存する'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  try {
    // クライアントデータを取得
    const clients = await getSheetData(config.SHEET_NAMES.CLIENT);
    
    return {
      props: {
        clientsData: clients,
      },
    };
  } catch (error) {
    console.error('データ取得エラー:', error);
    
    return {
      props: {
        clientsData: [],
        error: 'データの取得中にエラーが発生しました。',
      },
    };
  }
}