import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SESSION_STATUS, SESSION_TYPE } from '../../lib/constants';

// セッション編集フォームコンポーネント
export default function SessionEditForm({ sessionData, clientData, onSave, onCancel, loading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    defaultValues: {
      予定日時: '',
      セッション種別: '',
      ステータス: '',
      'Google Meet URL': '',
      メモ: ''
    }
  });

  // フォームの初期値を設定
  useEffect(() => {
    if (sessionData) {
      // 日時フォーマットの調整（YYYY-MM-DDThh:mm 形式に）
      let scheduledTime = sessionData.予定日時 || '';
      if (scheduledTime) {
        try {
          const date = new Date(scheduledTime);
          if (!isNaN(date.getTime())) {
            // ローカルタイムゾーンでのISO文字列を取得してT以降の秒とミリ秒を削除
            scheduledTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
              .toISOString()
              .slice(0, 16);
          }
        } catch (e) {
          console.error('日付変換エラー:', e);
        }
      }

      reset({
        予定日時: scheduledTime,
        セッション種別: sessionData.セッション種別 || '',
        ステータス: sessionData.ステータス || '',
        'Google Meet URL': sessionData['Google Meet URL'] || '',
        メモ: sessionData.メモ || ''
      });
    }
  }, [sessionData, reset]);

  // フォーム送信処理
  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
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
              <option value={SESSION_TYPE.TRIAL}>{SESSION_TYPE.TRIAL}</option>
              <option value={SESSION_TYPE.CONTINUATION_1}>{SESSION_TYPE.CONTINUATION_1}</option>
              <option value={SESSION_TYPE.CONTINUATION_2}>{SESSION_TYPE.CONTINUATION_2}</option>
              <option value={SESSION_TYPE.CONTINUATION_3}>{SESSION_TYPE.CONTINUATION_3}</option>
              <option value={SESSION_TYPE.CONTINUATION_4}>{SESSION_TYPE.CONTINUATION_4}</option>
              <option value={SESSION_TYPE.CONTINUATION_5}>{SESSION_TYPE.CONTINUATION_5}</option>
              <option value={SESSION_TYPE.CUSTOM}>{SESSION_TYPE.CUSTOM}</option>
            </select>
            {errors.セッション種別 && (
              <p className="mt-1 text-sm text-red-600">{errors.セッション種別.message}</p>
            )}
          </div>

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
            />
            {errors.予定日時 && (
              <p className="mt-1 text-sm text-red-600">{errors.予定日時.message}</p>
            )}
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
              <option value={SESSION_STATUS.SCHEDULED}>{SESSION_STATUS.SCHEDULED}</option>
              <option value={SESSION_STATUS.COMPLETED}>{SESSION_STATUS.COMPLETED}</option>
              <option value={SESSION_STATUS.CANCELED}>{SESSION_STATUS.CANCELED}</option>
              <option value={SESSION_STATUS.POSTPONED}>{SESSION_STATUS.POSTPONED}</option>
            </select>
            {errors.ステータス && (
              <p className="mt-1 text-sm text-red-600">{errors.ステータス.message}</p>
            )}
          </div>

          {/* Google Meet URL */}
          <div>
            <label
              htmlFor="meetUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Google Meet URL
            </label>
            <input
              id="meetUrl"
              type="url"
              {...register('Google Meet URL', {
                pattern: {
                  value: /^https?:\/\/.+/i,
                  message: '有効なURLを入力してください'
                }
              })}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502] ${
                errors['Google Meet URL'] ? 'border-red-300' : ''
              }`}
            />
            {errors['Google Meet URL'] && (
              <p className="mt-1 text-sm text-red-600">{errors['Google Meet URL'].message}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* クライアント情報（読み取り専用） */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">クライアント情報</h3>
            
            {clientData ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">氏名:</span> {clientData.お名前}
                </p>
                <p className="text-sm">
                  <span className="font-medium">メール:</span>{' '}
                  <a href={`mailto:${clientData.メールアドレス}`} className="text-[#c50502]">
                    {clientData.メールアドレス}
                  </a>
                </p>
                <p className="text-sm">
                  <span className="font-medium">希望形式:</span> {clientData.希望セッション形式 || '未設定'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">クライアント情報が見つかりません</p>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              ※クライアント情報の変更はクライアント詳細画面から行えます
            </p>
          </div>

          {/* セッションメモ */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              セッションメモ
            </label>
            <textarea
              id="notes"
              rows={7}
              {...register('メモ')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#c50502] focus:ring-[#c50502]"
              placeholder="セッションに関するメモや備考を入力してください"
            />
          </div>
        </div>
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