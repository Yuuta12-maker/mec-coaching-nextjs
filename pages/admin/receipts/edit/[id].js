import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import moment from 'moment';
import Layout from '../../../../components/Layout';
import AdminGuard from '../../../../components/AdminGuard';

const EditReceiptPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  
  const [receipt, setReceipt] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  
  // フォーム状態
  const [formData, setFormData] = useState({});

  // 領収書データの取得
  const fetchReceipt = async (receiptId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/receipts/${receiptId}`);
      setReceipt(response.data);
      
      // フォームに初期値を設定
      const data = response.data;
      setFormData({
        receiptNumber: data.receiptNumber,
        issueDate: moment(data.issueDate).format('YYYY-MM-DD'),
        clientId: data.clientId || '',
        recipientName: data.recipientName,
        recipientAddress: data.recipientAddress || '',
        email: data.email || '',
        sessionType: getSessionTypeFromDescription(data.description) || 'other',
        description: data.description,
        amount: data.amount.toString(),
        taxRate: data.taxRate.toString(),
        paymentMethod: data.paymentMethod,
        issuerName: data.issuerName,
        issuerTitle: data.issuerTitle,
        issuerAddress: data.issuerAddress,
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Error fetching receipt:', error);
      alert('領収書データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // クライアントデータの取得
  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('クライアントデータの取得に失敗しました');
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && id) {
      Promise.all([
        fetchReceipt(id),
        fetchClients()
      ]);
    }
  }, [status, id]);

  // 説明文からセッションタイプを推測
  const getSessionTypeFromDescription = (description) => {
    if (!description) return null;
    
    if (description.includes('トライアル')) {
      return 'trial';
    } else if (description.includes('継続')) {
      return 'continuation';
    } else if (description.includes('全6回') || description.includes('フルプログラム')) {
      return 'full';
    }
    
    return 'other';
  };

  // セッションタイプが変更されたときに金額と説明を自動設定
  const handleSessionTypeChange = (value) => {
    if (value === 'trial') {
      setFormData({ 
        ...formData,
        sessionType: value,
        amount: '6000',
        description: 'マインドエンジニアリング・コーチング トライアルセッション'
      });
    } else if (value === 'continuation') {
      setFormData({ 
        ...formData,
        sessionType: value,
        amount: '214000',
        description: 'マインドエンジニアリング・コーチング 継続セッション（2回目〜6回目）'
      });
    } else if (value === 'full') {
      setFormData({ 
        ...formData,
        sessionType: value,
        amount: '220000',
        description: 'マインドエンジニアリング・コーチング フルプログラム（全6回）'
      });
    } else {
      setFormData({
        ...formData,
        sessionType: value
      });
    }
  };

  // クライアントが選択されたときに情報を自動入力
  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    if (selectedClient) {
      setFormData({
        ...formData,
        clientId: clientId,
        recipientName: selectedClient.name,
        recipientAddress: selectedClient.address || '',
        email: selectedClient.email || '',
      });
    }
  };

  // フォーム入力ハンドラ
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 領収書の更新
  const handleUpdate = async () => {
    try {
      setSaving(true);
      
      // 日付を適切なフォーマットに変換
      const formattedValues = {
        ...formData,
        amount: parseFloat(formData.amount),
        taxRate: parseFloat(formData.taxRate),
      };
      
      await axios.put(`/api/receipts/${id}`, formattedValues);
      setSaving(false);
      alert('領収書を更新しました');
      router.push('/admin/receipts');
    } catch (error) {
      console.error('Error updating receipt:', error);
      setSaving(false);
      alert('領収書の更新に失敗しました');
    }
  };

  // 領収書のプレビュー生成
  const generatePreview = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/receipts/generate-preview', formData);
      setPreview(response.data.previewUrl);
      setLoading(false);
      alert('プレビューを生成しました');
    } catch (error) {
      console.error('Error generating preview:', error);
      setLoading(false);
      alert('プレビュー生成に失敗しました');
    }
  };

  // PDF生成
  const generatePDF = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/receipts/generate-pdf', formData, {
        responseType: 'blob',
      });
      
      // PDFをStateに保存
      setPdfBlob(response.data);
      setLoading(false);
      alert('領収書PDFを生成しました');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setLoading(false);
      alert('PDF生成に失敗しました');
    }
  };

  // PDFダウンロード
  const downloadPDF = () => {
    if (!pdfBlob) {
      alert('まずPDFを生成してください');
      return;
    }

    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `領収書_${formData.receiptNumber}_${formData.recipientName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // メール送信
  const sendByEmail = async () => {
    try {
      setSaving(true);
      await axios.post(`/api/receipts/send-email/${id}`);
      setSaving(false);
      alert('領収書をメールで送信しました');
    } catch (error) {
      console.error('Error sending email:', error);
      setSaving(false);
      alert('メール送信に失敗しました');
    }
  };

  if (status === 'loading' || loading && !receipt) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <AdminGuard>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ローディングオーバーレイ */}
          {(loading || saving) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
                <span>処理中...</span>
              </div>
            </div>
          )}

          {/* ページヘッダー */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <nav className="flex mb-3" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    <li>
                      <Link href="/admin" className="text-gray-500 hover:text-primary">
                        管理画面
                      </Link>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <Link href="/admin/receipts" className="ml-2 text-gray-500 hover:text-primary">
                        領収書管理
                      </Link>
                    </li>
                    <li className="flex items-center">
                      <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-2 text-gray-700 font-medium">編集</span>
                    </li>
                  </ol>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">領収書編集</h1>
                <p className="mt-1 text-sm text-gray-600">
                  領収書の情報を編集します。
                </p>
              </div>
              <div className="flex space-x-3">
                <Link 
                  href="/admin/receipts" 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  一覧に戻る
                </Link>
                <button 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  onClick={handleUpdate}
                  disabled={saving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                  保存
                </button>
              </div>
            </div>
          </div>

          {/* 編集フォーム */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">領収書情報編集</h2>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-1">領収書番号</label>
                      <input
                        id="receiptNumber"
                        name="receiptNumber"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.receiptNumber || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">発行日</label>
                      <input
                        id="issueDate"
                        name="issueDate"
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.issueDate || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">クライアント情報</h3>
                    
                    <div className="mb-4">
                      <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">クライアント選択</label>
                      <select
                        id="clientId"
                        name="clientId"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.clientId || ''}
                        onChange={(e) => handleClientChange(e.target.value)}
                      >
                        <option value="">選択してください</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-1">宛名（受領者）</label>
                      <input
                        id="recipientName"
                        name="recipientName"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.recipientName || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                      <input
                        id="recipientAddress"
                        name="recipientAddress"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.recipientAddress || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">支払い情報</h3>
                    
                    <div className="mb-4">
                      <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700 mb-1">セッション種別</label>
                      <select
                        id="sessionType"
                        name="sessionType"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.sessionType || ''}
                        onChange={(e) => handleSessionTypeChange(e.target.value)}
                        required
                      >
                        <option value="">選択してください</option>
                        <option value="trial">トライアルセッション</option>
                        <option value="continuation">継続セッション（2〜6回目）</option>
                        <option value="full">フルプログラム（全6回）</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">品目・説明</label>
                        <input
                          id="description"
                          name="description"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={formData.description || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">金額（税込）</label>
                        <div className="relative">
                          <input
                            id="amount"
                            name="amount"
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                            value={formData.amount || ''}
                            onChange={handleInputChange}
                            required
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none bg-gray-100 rounded-r-md border-l border-gray-300">
                            <span className="text-gray-500">円</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">消費税率</label>
                      <div className="relative w-32">
                        <input
                          id="taxRate"
                          name="taxRate"
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                          value={formData.taxRate || ''}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none bg-gray-100 rounded-r-md border-l border-gray-300">
                          <span className="text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">支払方法</label>
                      <select
                        id="paymentMethod"
                        name="paymentMethod"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.paymentMethod || ''}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="bankTransfer">銀行振込</option>
                        <option value="cash">現金</option>
                        <option value="creditCard">クレジットカード</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">発行者情報</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="issuerName" className="block text-sm font-medium text-gray-700 mb-1">発行者名</label>
                        <input
                          id="issuerName"
                          name="issuerName"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={formData.issuerName || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="issuerTitle" className="block text-sm font-medium text-gray-700 mb-1">事業名・組織名</label>
                        <input
                          id="issuerTitle"
                          name="issuerTitle"
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={formData.issuerTitle || ''}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="issuerAddress" className="block text-sm font-medium text-gray-700 mb-1">発行者住所</label>
                      <input
                        id="issuerAddress"
                        name="issuerAddress"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.issuerAddress || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.notes || ''}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">アクション</h2>
                
                <div className="space-y-4">
                  <button
                    type="button"
                    className="w-full bg-primary text-white hover:bg-primary-dark py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    onClick={handleUpdate}
                    disabled={loading || saving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    保存
                  </button>
                  
                  <button
                    type="button"
                    className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    onClick={generatePreview}
                    disabled={loading || saving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    プレビュー
                  </button>
                  
                  <button
                    type="button"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    onClick={generatePDF}
                    disabled={loading || saving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    PDF生成
                  </button>
                  
                  <button
                    type="button"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    onClick={downloadPDF}
                    disabled={!pdfBlob || loading || saving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    PDFをダウンロード
                  </button>
                  
                  <button
                    type="button"
                    className="w-full bg-green-600 text-white hover:bg-green-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center"
                    onClick={sendByEmail}
                    disabled={!formData.email || loading || saving}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    メールで送信
                  </button>
                </div>
              </div>
              
              {preview && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">プレビュー</h2>
                  <div className="flex justify-center">
                    <img 
                      src={preview} 
                      alt="領収書プレビュー" 
                      className="max-w-full border border-gray-200 rounded" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </AdminGuard>
  );
};

export default EditReceiptPage;