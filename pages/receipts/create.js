import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { formatDate } from '../../lib/utils';
import { PAYMENT_ITEM, CORPORATE_COLOR } from '../../lib/constants';
import dynamic from 'next/dynamic';

// PDF生成ライブラリをクライアントサイドのみでロード
const ReceiptGenerator = dynamic(
  () => import('../../components/receipts/ReceiptGenerator'),
  { ssr: false }
);

export default function CreateReceiptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/receipts/create');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  // フォーム状態の管理
  const [formData, setFormData] = useState({
    receiptNum: '',
    receiptDate: formatDate(new Date(), 'yyyy-MM-dd'),
    clientName: '',
    clientAddress: '',
    serviceType: '',
    customAmount: '',
    customDescription: '',
    paymentMethod: '銀行振込',
    taxType: '税込表示',
    includeStamp: true
  });
  
  // バリデーション状態
  const [showAlert, setShowAlert] = useState(false);
  
  // フォーム入力の変更を処理
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [id]: type === 'checkbox' ? checked : value
    });
    
    // サービス種別が変更された場合は摘要を自動設定
    if (id === 'serviceType') {
      let description = '';
      switch (value) {
        case 'trial':
          description = 'マインドエンジニアリング・コーチング 初回トライアルセッション';
          break;
        case 'continuation':
          description = 'マインドエンジニアリング・コーチング 継続セッション 5回分';
          break;
        case 'full':
          description = 'マインドエンジニアリング・コーチング プログラム全6回';
          break;
      }
      setFormData(prev => ({ ...prev, customDescription: description }));
    }
  };
  
  // バリデーション
  const validateForm = () => {
    const { receiptDate, clientName, serviceType, customAmount } = formData;
    const valid = receiptDate && clientName && serviceType && (serviceType !== 'custom' || customAmount);
    setShowAlert(!valid);
    return valid;
  };
  
  // フォーム送信処理
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // 領収書の生成処理はReceiptGeneratorコンポーネントで処理
    }
  };
  
  // 金額計算
  const calculateAmount = () => {
    const { serviceType, customAmount } = formData;
    let amount = 0;
    switch (serviceType) {
      case 'trial':
        amount = 6000;
        break;
      case 'continuation':
        amount = 214000;
        break;
      case 'full':
        amount = 220000;
        break;
      case 'custom':
        amount = parseInt(customAmount, 10) || 0;
        break;
    }
    return amount;
  };
  
  // 日付のフォーマット
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  // ローディング表示
  if (loading && status !== 'authenticated') {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  // 計算された金額
  const amount = calculateAmount();
  
  // 税金計算
  const taxExcludedAmount = Math.floor(amount / 1.1);
  const taxAmount = amount - taxExcludedAmount;

  return (
    <Layout>
      <Head>
        <title>領収書作成 | マインドエンジニアリング・コーチング</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">領収書作成</h1>
        <p className="text-gray-600">クライアントへの領収書を作成・出力します</p>
      </div>
      
      <div className="flex flex-wrap gap-8">
        {/* フォーム部分 */}
        <div className="flex-1 min-w-[300px] bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b-2" style={{ borderColor: CORPORATE_COLOR }}>領収書情報入力</h2>
          
          {showAlert && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              必須項目を入力してください。
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="receiptNum" className="block font-bold mb-1 text-gray-700">
                領収書番号
              </label>
              <input
                type="text"
                id="receiptNum"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="例：MEC-2025-001"
                value={formData.receiptNum}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="receiptDate" className="block font-bold mb-1 text-gray-700">
                発行日 <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="receiptDate"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.receiptDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="clientName" className="block font-bold mb-1 text-gray-700">
                宛名 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="clientName"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="例：山田 太郎"
                value={formData.clientName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="clientAddress" className="block font-bold mb-1 text-gray-700">
                住所
              </label>
              <input
                type="text"
                id="clientAddress"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="例：東京都渋谷区〇〇町1-2-3"
                value={formData.clientAddress}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="serviceType" className="block font-bold mb-1 text-gray-700">
                サービス種別 <span className="text-red-600">*</span>
              </label>
              <select
                id="serviceType"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.serviceType}
                onChange={handleChange}
                required
              >
                <option value="">選択してください</option>
                <option value="trial">初回トライアルセッション（税込6,000円）</option>
                <option value="continuation">継続セッション 5回分（税込214,000円）</option>
                <option value="full">マインドエンジニアリング・コーチングプログラム全6回（税込220,000円）</option>
                <option value="custom">その他（金額手動入力）</option>
              </select>
            </div>
            
            {formData.serviceType === 'custom' && (
              <div className="mb-4">
                <label htmlFor="customAmount" className="block font-bold mb-1 text-gray-700">
                  金額（税込） <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  id="customAmount"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="例：10000"
                  value={formData.customAmount}
                  onChange={handleChange}
                />
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="customDescription" className="block font-bold mb-1 text-gray-700">
                摘要
              </label>
              <textarea
                id="customDescription"
                rows="2"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="例：コーチングセッション 〇月分"
                value={formData.customDescription}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="paymentMethod" className="block font-bold mb-1 text-gray-700">
                支払方法
              </label>
              <select
                id="paymentMethod"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="銀行振込">銀行振込</option>
                <option value="現金">現金</option>
                <option value="クレジットカード">クレジットカード</option>
                <option value="その他">その他</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="taxType" className="block font-bold mb-1 text-gray-700">
                税区分
              </label>
              <select
                id="taxType"
                className="w-full p-2 border border-gray-300 rounded"
                value={formData.taxType}
                onChange={handleChange}
              >
                <option value="税込表示">税込表示</option>
                <option value="税抜表示">税抜表示</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  id="includeStamp"
                  checked={formData.includeStamp}
                  onChange={handleChange}
                  className="mr-2"
                />
                収入印紙を表示する
              </label>
            </div>
          </form>
          
          <div className="mt-4">
            <button
              onClick={() => validateForm()}
              className={`px-4 py-2 rounded text-white font-medium mr-3`}
              style={{ backgroundColor: CORPORATE_COLOR }}
            >
              プレビュー更新
            </button>
            <ReceiptGenerator
              formData={formData}
              validateForm={validateForm}
              amount={amount}
              taxExcludedAmount={taxExcludedAmount}
              taxAmount={taxAmount}
              formattedDate={formatDisplayDate(formData.receiptDate)}
            />
          </div>
        </div>
        
        {/* プレビュー部分 */}
        <div className="flex-1 min-w-[300px] bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b-2" style={{ borderColor: CORPORATE_COLOR }}>領収書プレビュー</h2>
          
          <div className="receipt border border-gray-300 p-6 relative min-h-[600px]" id="receipt">
            {/* 透かし */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-30 text-9xl pointer-events-none z-0" style={{ color: `rgba(197, 5, 2, 0.05)` }}>
              領収書
            </div>
            
            {/* 領収書内容 */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold inline-block pb-2 border-b-2" style={{ borderColor: CORPORATE_COLOR }}>
                  領　収　書
                </h3>
                <div className="absolute top-0 right-0">{formatDisplayDate(formData.receiptDate)}</div>
                <div className="absolute top-0 left-0">{formData.receiptNum ? `No. ${formData.receiptNum}` : ''}</div>
              </div>
              
              <div className="mb-6">
                <div className="mb-1 text-lg font-medium">
                  {formData.clientName ? `${formData.clientName} 様` : ''}
                </div>
                <div className="text-sm text-gray-600">{formData.clientAddress}</div>
              </div>
              
              <div className="text-center py-3 mb-6 border-b border-black">
                <span>金額：</span>
                <span className="text-2xl font-bold">{amount.toLocaleString()}</span>
                <span className="font-bold">円</span>
                <span className="ml-2 text-sm">
                  ({formData.taxType === '税込表示' ? '税込' : '税抜価格+消費税'})
                </span>
              </div>
              
              <div className="mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 bg-gray-100 p-2 w-3/4">摘要</th>
                      <th className="border border-gray-300 bg-gray-100 p-2 w-1/4">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">{formData.customDescription}</td>
                      <td className="border border-gray-300 p-2 text-right">
                        {formData.taxType === '税込表示' 
                          ? amount.toLocaleString() 
                          : taxExcludedAmount.toLocaleString()}円
                      </td>
                    </tr>
                    {formData.taxType === '税抜表示' && (
                      <>
                        <tr>
                          <td className="border border-gray-300 p-2">消費税（10%）</td>
                          <td className="border border-gray-300 p-2 text-right">{taxAmount.toLocaleString()}円</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2 text-right font-bold">合計</td>
                          <td className="border border-gray-300 p-2 text-right font-bold">{amount.toLocaleString()}円</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="text-center mb-6">
                <p>上記金額を{formData.paymentMethod}にて正に領収いたしました。</p>
                
                {formData.includeStamp && (
                  <div className="absolute bottom-32 right-12 w-24 h-24">
                    <div className="border-2 border-double rounded-full w-full h-full flex flex-col justify-center items-center text-center font-bold transform rotate-15" style={{ borderColor: CORPORATE_COLOR, color: CORPORATE_COLOR }}>
                      <div>収入</div>
                      <div>印紙</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center pt-4 border-t border-gray-300">
                <p className="font-bold text-lg mb-1">マインドエンジニアリング・コーチング</p>
                <p className="m-0">森山雄太（個人事業主）</p>
                <p className="m-0">〒790-0012 愛媛県松山市湊町2-5-2リコオビル401</p>
                <p className="m-0">TEL: 090-5710-7627</p>
                <p className="m-0">Email: mindengineeringcoaching@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: ${CORPORATE_COLOR};
          animation: rotate 1s linear infinite;
          margin: 0 auto;
        }
        .-rotate-30 {
          transform: translate(-50%, -50%) rotate(-30deg);
        }
        .rotate-15 {
          transform: rotate(15deg);
        }
      `}</style>
    </Layout>
  );
}
