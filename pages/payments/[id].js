import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { fetchData, formatDate, formatCurrency, getStatusColorClass } from '../../lib/api-utils';

export default function PaymentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [payment, setPayment] = useState(null);
  const [client, setClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // react-hook-formの設定
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  
  // 支払い情報とクライアント情報の取得
  useEffect(() => {
    async function loadPaymentData() {
      if (!id) return; // IDがない場合は何もしない
      
      try {
        setIsLoading(true);
        setError(null);
        
        // APIから支払い詳細を取得
        const result = await fetchData(`payments/${id}`);
        
        if (result && result.payment) {
          setPayment(result.payment);
          
          // クライアント情報も取得
          if (result.client) {
            setClient(result.client);
          } else {
            // クライアント情報が含まれていない場合は別途取得
            const clientResult = await fetchData(`clients/${result.payment.クライアントID}`);
            if (clientResult && clientResult.client) {
              setClient(clientResult.client);
            }
          }
          
          // フォームの初期値を設定
          reset({
            クライアントID: result.payment.クライアントID,
            項目: result.payment.項目,
            金額: result.payment.金額,
            状態: result.payment.状態,
            登録日: result.payment.登録日,
            入金日: result.payment.入金日 || '',
            備考: result.payment.備考 || ''
          });
        }
      } catch (err) {
        console.error('支払いデータ取得エラー:', err);
        setError(err.message || '支払い情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPaymentData();
  }, [id, reset]);

  // 編集フォームの送信
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // APIエンドポイントへデータを送信
      const response = await fetch('/api/payments/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          支払いID: id,
          ...data,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '支払い情報の更新に失敗しました');
      }
      
      // 成功した場合、メッセージを表示して編集モードを終了
      setSuccessMessage('支払い情報を更新しました');
      setPayment({ ...payment, ...data });
      setIsEditing(false);
      
    } catch (err) {
      console.error('エラー:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 入金確認処理
  const confirmPayment = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // APIエンドポイントへデータを送信
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          支払いID: id,
          入金日: new Date().toISOString().split('T')[0]
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '入金確認に失敗しました');
      }
      
      // 成功した場合、ページをリロード
      router.reload();
      
    } catch (err) {
      console.error('エラー:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 請求書生成処理
  const generateInvoice = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // APIエンドポイントへデータを送信
      const response = await fetch('/api/payments/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          支払いID: id
        }),
      });
      
      // レスポンスが正常かチェック
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '請求書の生成に失敗しました');
      }
      
      // PDFとしてレスポンスを取得
      const blob = await response.blob();
      
      // ダウンロードリンクを作成
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `請求書_${client?.お名前 || 'クライアント'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // リンクをクリックしてダウンロード
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccessMessage('請求書を生成しました');
      
    } catch (err) {
      console.error('エラー:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center my-12">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (error && !payment) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">エラーが発生しました</p>
          <p>{error}</p>
        </div>
        <Link href="/payments" className="text-primary hover:underline">
          支払い一覧に戻る
        </Link>
      </Layout>
    );
  }

  if (!payment || !client) {
    return (
      <Layout>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">データが見つかりません</p>
          <p>指定された支払いデータが見つかりませんでした。</p>
        </div>
        <Link href="/payments" className="text-primary hover:underline">
          支払い一覧に戻る
        </Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>支払い詳細 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="page-title">支払い詳細</h1>
            <p className="page-description">
              <Link href={`/clients/${client.クライアントID}`} className="text-primary hover:text-primary-dark">
                {client.お名前}
              </Link>
              の支払い情報
            </p>
          </div>
          <div className="mt-3 sm:mt-0">
            <Link href="/payments" className="btn btn-outline">
              <span className="material-icons mr-1">arrow_back</span>
              支払い一覧に戻る
            </Link>
          </div>
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          <p className="flex items-center">
            <span className="material-icons mr-2 text-red-500">error</span>
            {error}
          </p>
        </div>
      )}
      
      {/* 成功メッセージ */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
          <p className="flex items-center">
            <span className="material-icons mr-2 text-green-500">check_circle</span>
            {successMessage}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="card-title">支払い情報</h2>
              <div className="flex space-x-2">
                {!isEditing && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <span className="material-icons mr-1 text-sm">edit</span>
                    編集
                  </button>
                )}
                
                {payment.状態 !== '入金済み' && !isEditing && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={confirmPayment}
                    disabled={isSubmitting}
                  >
                    <span className="material-icons mr-1 text-sm">check</span>
                    入金確認
                  </button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              // 編集フォーム
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                
                {/* ボタン */}
                <div className="flex justify-end space-x-3 border-t border-gray-100 pt-6">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                  >
                    キャンセル
                  </button>
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
            ) : (
              // 詳細表示
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 項目 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">項目</h3>
                    <p className="mt-1 text-lg">{payment.項目}</p>
                  </div>
                  
                  {/* 金額 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">金額</h3>
                    <p className="mt-1 text-lg font-semibold">{formatCurrency(payment.金額)}</p>
                  </div>
                  
                  {/* 状態 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">状態</h3>
                    <p className="mt-1">
                      <span className={`px-2 py-1 inline-flex text-sm leading-5 font-medium rounded-full ${getStatusColorClass(payment.状態)}`}>
                        {payment.状態 || '未入金'}
                      </span>
                    </p>
                  </div>
                  
                  {/* 登録日 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">登録日</h3>
                    <p className="mt-1 text-lg">
                      {formatDate(payment.登録日)}
                    </p>
                  </div>
                  
                  {/* 入金日 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">入金日</h3>
                    <p className="mt-1 text-lg">
                      {formatDate(payment.入金日)}
                    </p>
                  </div>
                </div>
                
                {/* 備考 */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-medium text-gray-500">備考</h3>
                  <p className="mt-1 whitespace-pre-wrap">
                    {payment.備考 || '(備考なし)'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          {/* クライアント情報 */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">クライアント情報</h2>
            </div>
            
            <div className="p-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-light text-primary flex items-center justify-center">
                  <span className="font-medium">{client.お名前?.charAt(0) || '?'}</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-800">{client.お名前}</h3>
                  <p className="text-sm text-gray-500">{client.メールアドレス}</p>
                </div>
              </div>
              
              <Link href={`/clients/${client.クライアントID}`} className="btn btn-outline w-full">
                クライアント詳細を見る
              </Link>
            </div>
          </div>
          
          {/* アクション */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">アクション</h2>
            </div>
            
            <div className="p-4 space-y-3">
              <button
                className="btn btn-outline w-full flex items-center justify-center"
                onClick={generateInvoice}
                disabled={isSubmitting}
              >
                <span className="material-icons mr-2">description</span>
                請求書を生成
              </button>
              
              {payment.状態 !== '入金済み' && (
                <button
                  className="btn btn-success w-full flex items-center justify-center"
                  onClick={confirmPayment}
                  disabled={isSubmitting}
                >
                  <span className="material-icons mr-2">check_circle</span>
                  入金確認
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}