import { useState } from 'react';
import { formatDate } from '../../lib/utils';
import { getStatusColor } from '../../lib/clients';

// クライアント詳細情報表示コンポーネント
export default function ClientDetail({ client }) {
  const [isSending, setIsSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  // テンプレートタイプを定数として定義（lib/emailに依存せず）
  const EMAIL_TEMPLATES = {
    TRIAL_SCHEDULE_REQUEST: 'trial-schedule-request',
    PAYMENT_INSTRUCTION: 'payment-instruction'
  };

  // メール送信処理
  const sendEmail = async (templateName) => {
    if (!client || !client.メールアドレス) {
      setEmailStatus({
        success: false,
        message: 'メールアドレスが設定されていません'
      });
      return;
    }

    setIsSending(true);
    setEmailStatus(null);

    try {
      // 日程候補の生成（クライアントサイドで実施）
      const dateOptions = templateName === EMAIL_TEMPLATES.TRIAL_SCHEDULE_REQUEST 
        ? generateDateOptions(3) 
        : [];

      // 送信するデータの作成
      const emailData = {
        to: client.メールアドレス,
        subject: templateName === EMAIL_TEMPLATES.TRIAL_SCHEDULE_REQUEST 
          ? 'トライアルセッション日程調整のお知らせ'
          : 'お支払いのご案内',
        template: templateName,
        data: {
          name: client.お名前,
          dateOptions: dateOptions,
          paymentDue: 'セッション日の3日前まで'
        }
      };

      // APIを呼び出してメール送信
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (result.success) {
        setEmailStatus({
          success: true,
          message: 'メールを送信しました'
        });
      } else {
        throw new Error(result.message || 'メール送信に失敗しました');
      }
    } catch (error) {
      console.error('メール送信エラー:', error);
      setEmailStatus({
        success: false,
        message: error.message || 'メール送信中にエラーが発生しました'
      });
    } finally {
      setIsSending(false);
    }
  };

  // 日程候補を生成する関数
  const generateDateOptions = (count = 3) => {
    const options = [];
    const now = new Date();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const timeSlots = ['10:00-10:30', '15:00-15:30', '19:00-19:30'];
    
    // 現在の日付から2日後から開始する候補日程
    for (let i = 0; i < count; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + 2 + i);
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayOfWeek = dayNames[date.getDay()];
      
      // ランダムな時間枠を選択
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      
      options.push(`${month}月${day}日(${dayOfWeek}) ${timeSlot}`);
    }
    
    return options;
  };
  
  // ステータスが「問い合わせ」の場合に送信ボタンを表示するか判定
  const showEmailButtons = client && client.ステータス === '問い合わせ';

  if (!client) {
    return (
      <div className="p-6 text-center text-gray-500">
        クライアント情報を読み込めませんでした
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ステータスバッジ */}
      <div className="mb-6">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            client.ステータス || '未設定'
          )}`}
        >
          {client.ステータス || '未設定'}
        </span>
      </div>

      {/* 基本情報グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">氏名</h3>
            <p className="text-gray-900 font-medium">{client.お名前 || '未設定'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">氏名（カナ）</h3>
            <p className="text-gray-900">
              {client['お名前　（カナ）'] || '未設定'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">性別</h3>
            <p className="text-gray-900">{client.性別 || '未設定'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">生年月日</h3>
            <p className="text-gray-900">
              {client.生年月日 
                ? formatDate(client.生年月日, 'yyyy年MM月dd日') 
                : '未設定'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">希望セッション形式</h3>
            <p className="text-gray-900">{client.希望セッション形式 || '未設定'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">メールアドレス</h3>
            <p className="text-gray-900">
              <a
                href={`mailto:${client.メールアドレス}`}
                className="text-[#c50502] hover:underline"
              >
                {client.メールアドレス || '未設定'}
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">電話番号</h3>
            <p className="text-gray-900">
              <a
                href={`tel:${client['電話番号　（ハイフンなし）']}`}
                className="text-[#c50502] hover:underline"
              >
                {client['電話番号　（ハイフンなし）'] 
                  ? client['電話番号　（ハイフンなし）'].replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3') 
                  : '未設定'}
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">ご住所</h3>
            <p className="text-gray-900 break-words">
              {client.ご住所 || '未設定'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">登録日時</h3>
            <p className="text-gray-900">
              {client.タイムスタンプ 
                ? formatDate(client.タイムスタンプ, 'yyyy/MM/dd HH:mm') 
                : '未設定'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">最終更新日時</h3>
            <p className="text-gray-900">
              {client.更新日時 
                ? formatDate(client.更新日時, 'yyyy/MM/dd HH:mm') 
                : '未更新'}
            </p>
          </div>
        </div>
      </div>

      {/* 備考欄 */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-500 mb-2">備考欄</h3>
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-gray-700 whitespace-pre-wrap">
            {client.備考欄 || '備考はありません'}
          </p>
        </div>
      </div>
      
      {/* 問い合わせ回答ボタン（ステータスが問い合わせの場合のみ） */}
      {showEmailButtons && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">クライアント対応</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => sendEmail(EMAIL_TEMPLATES.TRIAL_SCHEDULE_REQUEST)}
              disabled={isSending}
              className={`px-4 py-2 rounded-md border ${isSending ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-[#c50502] hover:bg-[#a00401] text-white border-[#c50502]'}`}
            >
              トライアル日程調整メール送信
            </button>
            <button
              onClick={() => sendEmail(EMAIL_TEMPLATES.PAYMENT_INSTRUCTION)}
              disabled={isSending}
              className={`px-4 py-2 rounded-md border ${isSending ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-[#c50502] text-[#c50502] hover:bg-red-50'}`}
            >
              支払い案内メール送信
            </button>
          </div>
          
          {/* メール送信結果表示 */}
          {emailStatus && (
            <div className={`mt-4 p-3 rounded-md ${emailStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-center">
                <span className="material-icons mr-2">
                  {emailStatus.success ? 'check_circle' : 'error'}
                </span>
                <span>{emailStatus.message}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}