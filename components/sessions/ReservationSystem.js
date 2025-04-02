import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  MapPin, 
  Video, 
  Check 
} from 'lucide-react';
import { Button } from '../ui';
import { SESSION_FORMAT, PRICE } from '../../lib/constants';

const ReservationSystem = () => {
  // ステップ管理用のステート
  const [step, setStep] = useState(1);
  // 選択した日付
  const [selectedDate, setSelectedDate] = useState(null);
  // 選択した時間枠
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  // 選択したセッション形式
  const [sessionType, setSessionType] = useState(null);
  // 利用可能な時間枠
  const [availableSlots, setAvailableSlots] = useState([]);
  // 読み込み状態
  const [isLoading, setIsLoading] = useState(false);
  // エラー状態
  const [error, setError] = useState(null);
  // ユーザー情報
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    phone: '',
    remarks: ''
  });
  
  // 今月のカレンダーデータを生成
  const generateCalendarData = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // 月の最初の日
    const firstDay = new Date(year, month, 1);
    // 月の最後の日
    const lastDay = new Date(year, month + 1, 0);
    
    // カレンダーの週の開始日（日曜日）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // カレンダーの週の終了日
    const endDate = new Date(lastDay);
    if (endDate.getDay() < 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }
    
    const calendarDays = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      calendarDays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      year,
      month,
      days: calendarDays
    };
  };
  
  const calendar = generateCalendarData();
  
  // 曜日の名前（日本語）
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // 月の名前（日本語）
  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  
  // 利用可能な時間枠を取得（APIから取得する想定）
  const fetchAvailableTimeSlots = async (date) => {
    if (!date) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 本番環境ではAPIエンドポイントを呼び出す
      // const response = await fetch(`/api/sessions/available-slots?date=${date.toISOString().split('T')[0]}`);
      // const data = await response.json();
      // return data.slots;
      
      // ダミーデータ（実際の実装では削除）
      await new Promise(resolve => setTimeout(resolve, 500)); // API呼び出しを模倣
      
      // サンプルデータ：平日10時〜17時、2時間おきに予約枠を作成
      const day = date.getDay();
      // 土日は予約不可と仮定
      if (day === 0 || day === 6) return [];
      
      return [
        { id: 1, time: '10:00', available: true },
        { id: 2, time: '12:00', available: true },
        { id: 3, time: '14:00', available: true },
        { id: 4, time: '16:00', available: true },
      ];
    } catch (err) {
      console.error('時間枠取得エラー:', err);
      setError('予約可能な時間枠の取得に失敗しました。');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // 日付選択時に利用可能な時間枠を取得
  useEffect(() => {
    if (selectedDate) {
      (async () => {
        const slots = await fetchAvailableTimeSlots(selectedDate);
        setAvailableSlots(slots);
      })();
    }
  }, [selectedDate]);
  
  // 日付選択ハンドラー
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    setSessionType(null);
  };
  
  // 時間枠選択ハンドラー
  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setSessionType(null);
  };
  
  // セッション形式選択ハンドラー
  const handleSessionTypeSelect = (type) => {
    setSessionType(type);
  };
  
  // ユーザー情報更新ハンドラー
  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // ステップ移動ハンドラー
  const handleNext = () => {
    setStep(prev => prev + 1);
  };
  
  const handleBack = () => {
    setStep(prev => prev - 1);
  };
  
  // フォーム送信ハンドラー
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 予約データの構築
      const reservationData = {
        クライアント名: userInfo.name,
        メールアドレス: userInfo.email,
        電話番号: userInfo.phone,
        予定日時: `${selectedDate.toISOString().split('T')[0]}T${selectedTimeSlot.time}:00`,
        セッション種別: 'トライアル',
        セッション形式: sessionType === 'offline' ? SESSION_FORMAT.IN_PERSON : SESSION_FORMAT.ONLINE,
        メモ: userInfo.remarks,
        ステータス: '予定'
      };
      
      // 本番環境ではAPIエンドポイントを呼び出す
      // const response = await fetch('/api/sessions/reserve', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(reservationData),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.error || '予約登録に失敗しました');
      // }
      
      // const data = await response.json();
      
      // ダミー処理（実際の実装では削除）
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 送信後、確認ステップへ
      handleNext();
    } catch (err) {
      console.error('予約エラー:', err);
      setError(err.message || '予約処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 日付の形式変換
  const formatDate = (date) => {
    if (!date) return '';
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日(${weekdays[date.getDay()]})`;
  };
  
  // 予約可能な日付かどうかを判定
  const isAvailableDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 過去の日付は選択不可
    if (date < today) return false;
    
    // 土日は選択不可
    const day = date.getDay();
    if (day === 0 || day === 6) return false;
    
    return true;
  };
  
  // 今月の表示
  const currentMonthYear = `${calendar.year}年${months[calendar.month]}`;
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-[#c50502]">
        マインドエンジニアリング・コーチング<br />セッション予約
      </h1>
      
      {/* ステッププログレス */}
      <div className="flex justify-between mb-8 px-4">
        <div className={`relative flex flex-col items-center ${step >= 1 ? 'text-gray-800' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-[#c50502] bg-red-50' : 'border-gray-300'}`}>
            <CalendarIcon size={20} className={step >= 1 ? 'text-[#c50502]' : 'text-gray-400'} />
          </div>
          <div className="mt-2 text-sm font-medium">日程選択</div>
        </div>
        <div className={`grow border-t-2 self-start mt-5 ${step >= 2 ? 'border-[#c50502]' : 'border-gray-300'}`}></div>
        <div className={`relative flex flex-col items-center ${step >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-[#c50502] bg-red-50' : 'border-gray-300'}`}>
            <User size={20} className={step >= 2 ? 'text-[#c50502]' : 'text-gray-400'} />
          </div>
          <div className="mt-2 text-sm font-medium">情報入力</div>
        </div>
        <div className={`grow border-t-2 self-start mt-5 ${step >= 3 ? 'border-[#c50502]' : 'border-gray-300'}`}></div>
        <div className={`relative flex flex-col items-center ${step >= 3 ? 'text-gray-800' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-[#c50502] bg-red-50' : 'border-gray-300'}`}>
            <Check size={20} className={step >= 3 ? 'text-[#c50502]' : 'text-gray-400'} />
          </div>
          <div className="mt-2 text-sm font-medium">完了</div>
        </div>
      </div>
      
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">エラー</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* ステップ1: 日程と時間の選択 */}
      {step === 1 && (
        <div className="space-y-6">
          {/* カレンダーセクション */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <button 
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="前月"
                disabled
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold">{currentMonthYear}</h2>
              <button 
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="翌月"
                disabled
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {/* 曜日のヘッダー */}
              {weekdays.map((day, index) => (
                <div key={`weekday-${index}`} className="text-center py-2 font-medium text-sm">
                  {day}
                </div>
              ))}
              
              {/* 日付 */}
              {calendar.days.map((date, index) => {
                const isCurrentMonth = date.getMonth() === calendar.month;
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                const isAvailable = isAvailableDate(date);
                
                return (
                  <div 
                    key={`date-${index}`} 
                    className={`
                      text-center py-2 relative
                      ${!isCurrentMonth ? 'text-gray-300' : ''}
                      ${isToday ? 'font-bold' : ''}
                      ${isSelected ? 'bg-red-100 rounded-lg' : ''}
                      ${!isAvailable && isCurrentMonth ? 'line-through text-gray-400' : ''}
                    `}
                    onClick={() => isAvailable && isCurrentMonth && handleDateSelect(date)}
                  >
                    <div className={`
                      w-10 h-10 mx-auto flex items-center justify-center rounded-full
                      ${isSelected ? 'bg-[#c50502] text-white' : ''}
                      ${isAvailable && !isSelected && isCurrentMonth ? 'hover:bg-gray-200 cursor-pointer' : ''}
                    `}>
                      {date.getDate()}
                    </div>
                    {isAvailable && isCurrentMonth && !isSelected && (
                      <div className="w-1 h-1 bg-green-500 rounded-full absolute bottom-1 left-1/2 transform -translate-x-1/2"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 時間枠セクション */}
          {selectedDate && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">{formatDate(selectedDate)} の予約可能時間</h3>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="spinner-sm mx-auto"></div>
                  <p className="mt-2 text-gray-600">読み込み中...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {availableSlots.map(slot => (
                    <div
                      key={slot.id}
                      className={`
                        p-3 border rounded-lg text-center cursor-pointer transition
                        ${selectedTimeSlot && selectedTimeSlot.id === slot.id 
                          ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                          : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                        }
                        ${!slot.available ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                      `}
                      onClick={() => slot.available && handleTimeSlotSelect(slot)}
                    >
                      <Clock size={18} className="inline-block mr-1" />
                      {slot.time}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                  この日に予約可能な時間枠はありません。別の日を選択してください。
                </div>
              )}
            </div>
          )}
          
          {/* セッション形式選択 */}
          {selectedTimeSlot && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">セッション形式を選択してください</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`
                    p-4 border rounded-lg cursor-pointer transition flex items-center
                    ${sessionType === 'offline' 
                      ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                    }
                  `}
                  onClick={() => handleSessionTypeSelect('offline')}
                >
                  <MapPin size={24} className="mr-3" />
                  <div>
                    <div className="font-semibold">対面セッション</div>
                    <div className="text-sm text-gray-500">松山市湊町2-5-2 リコオビル401</div>
                  </div>
                </div>
                <div
                  className={`
                    p-4 border rounded-lg cursor-pointer transition flex items-center
                    ${sessionType === 'online' 
                      ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                    }
                  `}
                  onClick={() => handleSessionTypeSelect('online')}
                >
                  <Video size={24} className="mr-3" />
                  <div>
                    <div className="font-semibold">オンラインセッション</div>
                    <div className="text-sm text-gray-500">Google Meetを使用します</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Button
              variant="primary"
              size="lg"
              disabled={!selectedDate || !selectedTimeSlot || !sessionType || isLoading}
              onClick={handleNext}
            >
              次へ進む
            </Button>
          </div>
        </div>
      )}
      
      {/* ステップ2: 個人情報入力 */}
      {step === 2 && (
        <div>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">予約内容</h3>
            <p><span className="text-gray-600">日時：</span> {formatDate(selectedDate)} {selectedTimeSlot.time}</p>
            <p><span className="text-gray-600">セッション形式：</span> {sessionType === 'offline' ? '対面' : 'オンライン'}</p>
            <p><span className="text-gray-600">料金：</span> {PRICE.TRIAL.toLocaleString()}円（税込）</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1 font-medium">お名前 <span className="text-red-600">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c50502] focus:border-[#c50502]"
                value={userInfo.name}
                onChange={handleUserInfoChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block mb-1 font-medium">メールアドレス <span className="text-red-600">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c50502] focus:border-[#c50502]"
                value={userInfo.email}
                onChange={handleUserInfoChange}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block mb-1 font-medium">電話番号 <span className="text-red-600">*</span></label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c50502] focus:border-[#c50502]"
                value={userInfo.phone}
                onChange={handleUserInfoChange}
              />
            </div>
            
            <div>
              <label htmlFor="remarks" className="block mb-1 font-medium">備考</label>
              <textarea
                id="remarks"
                name="remarks"
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c50502] focus:border-[#c50502]"
                value={userInfo.remarks}
                onChange={handleUserInfoChange}
                placeholder="ご質問やご要望などございましたらご記入ください"
              ></textarea>
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={handleBack}
                disabled={isLoading}
              >
                戻る
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isLoading}
              >
                予約を確定する
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* ステップ3: 予約完了 */}
      {step === 3 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">予約が完了しました</h2>
          <p className="mb-6 text-gray-600">
            {formatDate(selectedDate)} {selectedTimeSlot.time}〜<br />
            セッション形式: {sessionType === 'offline' ? '対面' : 'オンライン'}<br />
            トライアルセッション (30分)
          </p>
          <p className="mb-8">
            予約内容の確認メールをお送りしました。<br />
            当日のセッションをお待ちしております。
          </p>
          <div className="bg-gray-50 p-4 mb-6 rounded-lg inline-block text-left">
            <h3 className="font-semibold mb-2 text-[#c50502]">初回トライアルセッションについて</h3>
            <p className="text-sm mb-2">
              ・料金: {PRICE.TRIAL.toLocaleString()}円 (税込)<br />
              ・セッション時間: 約30分<br />
              ・お支払い方法の詳細は確認メールに記載されています
            </p>
          </div>
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setSelectedDate(null);
                setSelectedTimeSlot(null);
                setSessionType(null);
                setUserInfo({
                  name: '',
                  email: '',
                  phone: '',
                  remarks: ''
                });
              }}
            >
              最初に戻る
            </Button>
          </div>
        </div>
      )}
      
      {/* スタイル */}
      <style jsx global>{`
        .spinner-sm {
          width: 1.5rem;
          height: 1.5rem;
          border: 2px solid #e5e7eb;
          border-top-color: #c50502;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReservationSystem;