import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CLIENT_STATUS, GENDER, SESSION_FORMAT } from '../../lib/constants';

// クライアント編集フォームコンポーネント
export default function ClientEditForm({ client, onSave, onCancel, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      お名前: '',
      'お名前　（カナ）': '',
      メールアドレス: '',
      '電話番号　（ハイフンなし）': '',
      性別: '',
      生年月日: '',
      ご住所: '',
      ステータス: '',
      希望セッション形式: '',
      備考欄: '',
    },
  });

  // クライアントデータの初期化
  useEffect(() => {
    if (client) {
      // 日付フォーマットの調整（YYYY-MM-DD形式に）
      let birthDate = client.生年月日 || '';
      if (birthDate && !birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // 様々な日付形式に対応
        try {
          const date = new Date(birthDate);
          if (!isNaN(date.getTime())) {
            birthDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('日付変換エラー:', e);
        }
      }

      // ステータスの正規化
      let status = client.ステータス || '';
      // 古いステータス表記を新しいステータス表記に変換
      switch (status) {
        case '問合せ':
          status = CLIENT_STATUS.INQUIRY;
          break;
        case 'トライアル予約済':
          status = CLIENT_STATUS.TRIAL_BEFORE;
          break;
        case 'トライアル実施済':
          status = CLIENT_STATUS.TRIAL_AFTER;
          break;
        case '継続中':
          status = CLIENT_STATUS.ONGOING;
          break;
      }

      reset({
        お名前: client.お名前 || '',
        'お名前　（カナ）': client['お名前　（カナ）'] || '',
        メールアドレス: client.メールアドレス || '',
        '電話番号　（ハイフンなし）': client['電話番号　（ハイフンなし）'] || '',
        性別: client.性別 || '',
        生年月日: birthDate,
        ご住所: client.ご住所 || '',
        ステータス: status,
        希望セッション形式: client.希望セッション形式 || '',
        備考欄: client.備考欄 || '',
      });
    }
  }, [client, reset]);

  // フォーム送信処理
  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* 氏名 */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('お名前', { required: '氏名は必須です' })}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502] ${
                errors.お名前 ? 'border-red-300' : ''
              }`}
            />
            {errors.お名前 && (
              <p className="mt-1 text-sm text-red-600">{errors.お名前.message}</p>
            )}
          </div>

          {/* 氏名（カナ） */}
          <div>
            <label
              htmlFor="nameKana"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              氏名（カナ）
            </label>
            <input
              id="nameKana"
              type="text"
              {...register('お名前　（カナ）')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register('メールアドレス', {
                required: 'メールアドレスは必須です',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '有効なメールアドレスを入力してください',
                },
              })}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502] ${
                errors.メールアドレス ? 'border-red-300' : ''
              }`}
            />
            {errors.メールアドレス && (
              <p className="mt-1 text-sm text-red-600">{errors.メールアドレス.message}</p>
            )}
          </div>

          {/* 電話番号 */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              電話番号（ハイフンなし）
            </label>
            <input
              id="phone"
              type="tel"
              {...register('電話番号　（ハイフンなし）', {
                pattern: {
                  value: /^[0-9]*$/,
                  message: '数字のみ入力してください',
                },
              })}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502] ${
                errors['電話番号　（ハイフンなし）'] ? 'border-red-300' : ''
              }`}
            />
            {errors['電話番号　（ハイフンなし）'] && (
              <p className="mt-1 text-sm text-red-600">
                {errors['電話番号　（ハイフンなし）'].message}
              </p>
            )}
          </div>

          {/* 性別 */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              性別
            </label>
            <select
              id="gender"
              {...register('性別')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
            >
              <option value="">選択してください</option>
              <option value={GENDER.MALE}>{GENDER.MALE}</option>
              <option value={GENDER.FEMALE}>{GENDER.FEMALE}</option>
              <option value={GENDER.OTHER}>{GENDER.OTHER}</option>
              <option value={GENDER.NO_ANSWER}>{GENDER.NO_ANSWER}</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {/* 生年月日 */}
          <div>
            <label
              htmlFor="birthdate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              生年月日
            </label>
            <input
              id="birthdate"
              type="date"
              {...register('生年月日')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
            />
          </div>

          {/* 住所 */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ご住所
            </label>
            <input
              id="address"
              type="text"
              {...register('ご住所')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
            />
          </div>

          {/* ステータス */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ステータス <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              {...register('ステータス', { required: 'ステータスは必須です' })}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502] ${
                errors.ステータス ? 'border-red-300' : ''
              }`}
            >
              <option value="">選択してください</option>
              <option value={CLIENT_STATUS.INQUIRY}>{CLIENT_STATUS.INQUIRY}</option>
              <option value={CLIENT_STATUS.TRIAL_BEFORE}>{CLIENT_STATUS.TRIAL_BEFORE}</option>
              <option value={CLIENT_STATUS.TRIAL_AFTER}>{CLIENT_STATUS.TRIAL_AFTER}</option>
              <option value={CLIENT_STATUS.ONGOING}>{CLIENT_STATUS.ONGOING}</option>
              <option value={CLIENT_STATUS.COMPLETED}>{CLIENT_STATUS.COMPLETED}</option>
              <option value={CLIENT_STATUS.SUSPENDED}>{CLIENT_STATUS.SUSPENDED}</option>
            </select>
            {errors.ステータス && (
              <p className="mt-1 text-sm text-red-600">{errors.ステータス.message}</p>
            )}
          </div>

          {/* 希望セッション形式 */}
          <div>
            <label
              htmlFor="sessionFormat"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              希望セッション形式
            </label>
            <select
              id="sessionFormat"
              {...register('希望セッション形式')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
            >
              <option value="">選択してください</option>
              <option value={SESSION_FORMAT.ONLINE}>{SESSION_FORMAT.ONLINE}</option>
              <option value={SESSION_FORMAT.IN_PERSON}>{SESSION_FORMAT.IN_PERSON}</option>
              <option value={SESSION_FORMAT.EITHER}>{SESSION_FORMAT.EITHER}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 備考欄 */}
      <div className="mt-6">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          備考欄
        </label>
        <textarea
          id="notes"
          rows={4}
          {...register('備考欄')}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
        />
      </div>

      {/* フォームボタン */}
      <div className="mt-8 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          disabled={loading}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#c50502] hover:bg-[#a00401]"
          disabled={loading || !isDirty}
        >
          {loading ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  );
}