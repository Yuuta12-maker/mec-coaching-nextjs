import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PaymentForm({ clientId, initialData, onSuccess, onCancel }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    クライアントID: clientId || '',
    項目: initialData?.項目 || 'トライアル',
    金額: initialData?.金額 || '',
    状態: initialData?.状態 || '未入金',
    入金日: initialData?.入金日 || '',
    備考: initialData?.備考 || '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isEditing = !!initialData?.支払いID;
  
  // 項目によって金額を自動設定
  useEffect(() => {
    if (formData.項目 === 'トライアル' && !isEditing) {
      setFormData(prev => ({ ...prev, 金額: '6000' }));
    } else if (formData.項目 === '継続プログラム' && !isEditing) {
      setFormData(prev => ({ ...prev, 金額: '214000' }));
    }
  }, [formData.項目, isEditing]);
  
  // 状態が入金済みに変更された場合、入金日を今日の日付にする
  useEffect(() => {
    if (formData.状態 === '入金済み' && !formData.入金日) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
      setFormData(prev => ({ ...prev, 入金日: today }));
    }
  }, [formData.状態]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // 必須項目のバリデーション
      if (!formData.クライアントID || !formData.項目 || !formData.金額) {
        throw new Error('クライアントID、項目、金額は必須です');
      }
      
      // 数値のバリデーション
      if (isNaN(parseInt(formData.金額))) {
        throw new Error('金額は数値で入力してください');
      }
      
      let url = '/api/payments';
      let method = 'POST';
      
      if (isEditing) {
        url = `/api/payments/${initialData.支払いID}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '支払い情報の保存に失敗しました');
      }
      
      // 成功した場合、成功コールバックを呼び出す
      if (onSuccess) {
        onSuccess(data);
      } else {
        // リダイレクト先が指定されていない場合は支払い一覧ページに移動
        router.push('/payments');
      }
      
    } catch (error) {
      console.error('支払い保存エラー:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          項目 <span className="text-red-500">*</span>
        </label>
        <select
          name="項目"
          value={formData.項目}
          onChange={handleChange}
          className="form-select block w-full"
          required
        >
          <option value="トライアル">トライアルセッション</option>
          <option value="継続プログラム">継続プログラム</option>
          <option value="その他">その他</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          金額 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">¥</span>
          <input
            type="text"
            name="金額"
            value={formData.金額}
            onChange={handleChange}
            className="form-input block w-full pl-8"
            placeholder="例：6000"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          状態
        </label>
        <select
          name="状態"
          value={formData.状態}
          onChange={handleChange}
          className="form-select block w-full"
        >
          <option value="未入金">未入金</option>
          <option value="入金済み">入金済み</option>
          <option value="キャンセル">キャンセル</option>
        </select>
      </div>
      
      {formData.状態 === '入金済み' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            入金日
          </label>
          <input
            type="date"
            name="入金日"
            value={formData.入金日}
            onChange={handleChange}
            className="form-input block w-full"
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          備考
        </label>
        <textarea
          name="備考"
          value={formData.備考}
          onChange={handleChange}
          className="form-textarea block w-full"
          rows="3"
          placeholder="備考を入力（任意）"
        />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 
            <span>保存中...</span> : 
            <span>{isEditing ? '更新する' : '保存する'}</span>
          }
        </button>
      </div>
    </form>
  );
}