import { formatDate } from '../../lib/utils';
import { getStatusColor } from '../../lib/clients';

// クライアント詳細情報表示コンポーネント
export default function ClientDetail({ client }) {
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
    </div>
  );
}