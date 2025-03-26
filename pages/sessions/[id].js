import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import SessionDetail from '../../components/sessions/SessionDetail';
import SessionEditForm from '../../components/sessions/SessionEditForm';
import { formatDate } from '../../lib/utils';
import { SessionFollowUpEmail, TrialFollowUpEmail } from '../../components/email';

export default function SessionPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  
  const [isEditing, setIsEditing] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [showFollowUpEmail, setShowFollowUpEmail] = useState(false);
  
  // モーダル用の状態
  const [showEmailModal, setShowEmailModal] = useState(false);

  // セッション情報を取得
  useEffect(() => {
    if (!id) return;

    async function fetchSessionData() {
      try {
        setLoading(true);
        setError(null);
        
        // セッション詳細とクライアント情報を取得
        const response = await fetch(`/api/sessions/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'セッション情報の取得に失敗しました');
        }
        
        const data = await response.json();
        setSessionData(data.session);
        setClientData(data.client);
        
        // セッションがすでに「実施済み」のステータスであれば、フォローアップメール表示フラグをON
        if (data.session.ステータス === '実施済み') {
          setShowFollowUpEmail(true);
        }
      } catch (err) {
        console.error('セッションデータ取得エラー:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSessionData();
  }, [id]);

  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/sessions/${id}`));
    }
  }, [status, router, id]);

  // セッション情報の更新処理
  const handleUpdateSession = async (updatedData) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新に失敗しました');
      }

      // 更新成功
      setSessionData({ ...sessionData, ...updatedData });
      setIsEditing(false);
      
      // 成功メッセージを表示
      alert('セッション情報を更新しました');
    } catch (err) {
      console.error('セッション更新エラー:', err);
      setError(err.message);
      alert('更新に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // セッションステータスの更新処理
  const handleStatusUpdate = async (newStatus, actionType) => {
    try {
      setStatusUpdateLoading(true);
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          actionType 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ステータス更新に失敗しました');
      }

      // 更新成功
      setSessionData({ 
        ...sessionData, 
        ステータス: newStatus,
        更新日時: new Date().toISOString(),
        ...(newStatus === '実施済み' ? { 実施日時: new Date().toISOString() } : {})
      });
      
      // 成功メッセージを表示
      const result = await response.json();
      alert(result.message || 'ステータスを更新しました');
      
      // セッションが実施済みになった場合は、メールモーダルを表示
      if (newStatus === '実施済み') {
        setShowFollowUpEmail(true);
        setShowEmailModal(true);
      }
    } catch (err) {
      console.error('ステータス更新エラー:', err);
      setError(err.message);
      alert('ステータス更新に失敗しました: ' + err.message);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // エメールモーダルを閉じる
  const closeEmailModal = () => {
    setShowEmailModal(false);
  };

  // ローディング表示
  if (loading && !sessionData) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="spinner"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </Layout>
    );
  }

  // エラー表示
  if (error && !sessionData) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h3 className="font-bold">エラーが発生しました</h3>
          <p>{error}</p>
        </div>
        <Link href="/sessions" className="text-[#c50502] hover:underline">
          セッション一覧に戻る
        </Link>
      </Layout>
    );
  }

  // セッション日時（あれば表示用にフォーマット）
  const formattedSessionDate = sessionData?.予定日時 
    ? formatDate(sessionData.予定日時, 'yyyy年MM月dd日 HH:mm') 
    : '';

  return (
    <Layout>
      <Head>
        <title>
          {formattedSessionDate ? `${formattedSessionDate} | セッション詳細` : 'セッション詳細'}
          | マインドエンジニアリング・コーチング
        </title>
      </Head>

      {/* ヘッダー部分 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/sessions" className="text-[#c50502] hover:underline">
              セッション一覧
            </Link>
            <span className="text-gray-500">&gt;</span>
            <h1 className="text-xl font-bold text-gray-800">
              {formattedSessionDate ? `${formattedSessionDate}のセッション` : 'セッション詳細'}
            </h1>
          </div>
          {sessionData && clientData && (
            <p className="text-gray-600">
              {clientData.お名前} ({sessionData.セッション種別 || '種別未設定'})
            </p>
          )}
        </div>
        <div className="mt-2 md:mt-0 flex gap-2">
          {!isEditing && (
            <>
              {/* セッションステータスに応じたアクションボタン */}
              {sessionData?.ステータス === '予定' && (
                <button
                  onClick={() => handleStatusUpdate('実施済み', 'complete')}
                  disabled={statusUpdateLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  {statusUpdateLoading ? '更新中...' : 'セッション完了'}
                </button>
              )}
              {sessionData?.ステータス !== 'キャンセル' && (
                <button
                  onClick={() => handleStatusUpdate('キャンセル', 'cancel')}
                  disabled={statusUpdateLoading}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  {statusUpdateLoading ? '更新中...' : 'キャンセル'}
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="bg-[#c50502] hover:bg-[#a00401] text-white px-4 py-2 rounded-md text-sm"
              >
                編集
              </button>
            </>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isEditing ? (
          <SessionEditForm
            sessionData={sessionData}
            clientData={clientData}
            onSave={handleUpdateSession}
            onCancel={() => setIsEditing(false)}
            loading={loading}
          />
        ) : (
          <SessionDetail
            sessionData={sessionData}
            clientData={clientData}
            showFollowUpEmail={showFollowUpEmail}
          />
        )}
      </div>
      
      {/* クライアントへのリンク */}
      {clientData && (
        <div className="mt-6">
          <Link
            href={`/clients/${clientData.クライアントID}`}
            className="inline-flex items-center text-[#c50502] hover:underline"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {clientData.お名前}のクライアント詳細を表示
          </Link>
        </div>
      )}

      {/* メールモーダル */}
      {showEmailModal && sessionData && clientData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white mx-4">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h3 className="text-xl font-bold text-gray-800">
                フォローアップメール
              </h3>
              <button
                onClick={closeEmailModal}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {sessionData.セッション種別 === 'トライアル' ? (
                <TrialFollowUpEmail
                  client={clientData}
                  sessionData={sessionData}
                  formUrl="https://docs.google.com/forms/d/1HNEkQx3ug5l9aPD3xnVVSpm0NIrhW1vHBT21iMYOlBU/edit"
                  onSend={closeEmailModal}
                />
              ) : (
                <SessionFollowUpEmail
                  client={clientData}
                  sessionData={sessionData}
                  calendarUrl="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0ZzWoMRPfGQfS0SMQNDVJMbEZyuT-lLDwFRNwvSjLFn7OG7hBBYKgfHKy3QNqQXzlb8AOnL1Uw"
                  onSend={closeEmailModal}
                />
              )}
            </div>
            
            <div className="mt-4 border-t pt-3 flex justify-end">
              <button
                onClick={closeEmailModal}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 mr-2 rounded-md"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}