import { useState, useEffect } from 'react';
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
  // 選択したセッション種別
  const [sessionTypeOption, setSessionTypeOption] = useState(null);
  // 予約成功データ
  const [reservationData, setReservationData] = useState(null);
  
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
  
  // 利用可能な時間枠を取得（APIから取得）
  const fetchAvailableTimeSlots = async (date) => {
    if (!date) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      // APIエンドポイントを呼び出して実際の予約状況を取得
      const formattedDate = formatDateForAPI(date);
      const response = await fetch(`/api/public/available-slots?date=${formattedDate}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '時間枠の取得に失敗しました');
      }
      
      const data = await response.json();
      return data.slots;
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
  
  // セッション種別選択ハンドラー
  const handleSessionTypeOptionSelect = (type) => {
    setSessionTypeOption(type);
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
  
  // 日本時間に対応した日付文字列を生成（YYYY-MM-DD形式）
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // フォーム送信ハンドラー
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 予約データの構築 - 日付をYYYY-MM-DD形式で直接構築（タイムゾーン対応）
      const submitData = {
        クライアント名: userInfo.name,
        メールアドレス: userInfo.email,
        電話番号: userInfo.phone,
        予定日時: `${formatDateForAPI(selectedDate)}T${selectedTimeSlot.time}:00`,
        セッション種別: sessionTypeOption,
        セッション形式: sessionType === 'offline' ? '対面' : 'オンライン',
        メモ: userInfo.remarks
      };
      
      console.log('送信データ:', submitData);
      
      // APIエンドポイントを呼び出す
      const response = await fetch('/api/public/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '予約登録に失敗しました');
      }
      
      const data = await response.json();
      console.log('予約成功:', data);
      setReservationData(data);
      
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
            <span className="material-icons text-[20px]">{step >= 1 ? 'event' : 'event_busy'}</span>
          </div>
          <div className="mt-2 text-sm font-medium">日程選択</div>
        </div>
        <div className={`grow border-t-2 self-start mt-5 ${step >= 2 ? 'border-[#c50502]' : 'border-gray-300'}`}></div>
        <div className={`relative flex flex-col items-center ${step >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-[#c50502] bg-red-50' : 'border-gray-300'}`}>
            <span className="material-icons text-[20px]">{step >= 2 ? 'person' : 'person_off'}</span>
          </div>
          <div className="mt-2 text-sm font-medium">情報入力</div>
        </div>
        <div className={`grow border-t-2 self-start mt-5 ${step >= 3 ? 'border-[#c50502]' : 'border-gray-300'}`}></div>
        <div className={`relative flex flex-col items-center ${step >= 3 ? 'text-gray-800' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-[#c50502] bg-red-50' : 'border-gray-300'}`}>
            <span className="material-icons text-[20px]">{step >= 3 ? 'check_circle' : 'radio_button_unchecked'}</span>
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
                <span className="material-icons">chevron_left</span>
              </button>
              <h2 className="text-lg font-semibold">{currentMonthYear}</h2>
              <button 
                className="p-2 rounded-full hover:bg-gray-200"
                aria-label="翌月"
                disabled
              >
                <span className="material-icons">chevron_right</span>
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
                      <span className="material-icons inline-block mr-1 text-[18px]">
                        {slot.available ? 'schedule' : 'event_busy'}
                      </span>
                      {slot.time}
                      {!slot.available && (
                        <div className="text-xs mt-1 text-red-500">予約済み</div>
                      )}
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
                  <span className="material-icons mr-3 text-[24px]">place</span>
                  <div>
                    <div className="font-semibold">対面セッション</div>
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
                  <span className="material-icons mr-3 text-[24px]">videocam</span>
                  <div>
                    <div className="font-semibold">オンラインセッション</div>
                    <div className="text-sm text-gray-500">Google Meetを使用します</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* セッション種別選択 */}
          {sessionType && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">セッション種別を選択してください</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div
                  className={`
                    p-4 border rounded-lg cursor-pointer transition flex items-center
                    ${sessionTypeOption === 'トライアル' 
                      ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                    }
                  `}
                  onClick={() => handleSessionTypeOptionSelect('トライアル')}
                >
                  <span className="material-icons mr-3 text-[24px]">new_releases</span>
                  <div className="font-semibold">トライアル</div>
                </div>
                <div
                  className={`
                    p-4 border rounded-lg cursor-pointer transition flex items-center
                    ${sessionTypeOption === '継続（2回目）' 
                      ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                    }
                  `}
                  onClick={() => handleSessionTypeOptionSelect('継続（2回目）')}
                >
                  <span className="material-icons mr-3 text-[24px]">looks_two</span>
                  <div className="font-semibold">継続（2回目）</div>
                </div>
                <div
                  className={`
                    p-4 border rounded-lg cursor-pointer transition flex items-center
                    ${sessionTypeOption === '継続（3回目）' 
                      ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                    }
                  `}
                  onClick={() => handleSessionTypeOptionSelect('継続（3回目）')}
                >
                  <span className="material-icons mr-3 text-[24px]">looks_3</span>
                  <div className="font-semibold">継続（3回目）</div>
                </div>
                <div
                  className={`
                    p-4 border rounded-lg cursor-pointer transition flex items-center
                    ${sessionTypeOption === '継続（4回目）' 
                      ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                    }
                  `}
                  onClick={() => handleSessionTypeOptionSelect('継続（4回目）')}
                >
                  <span className="material-icons mr-3 text-[24px]">looks_4</span>
                  <div className="font-semibold">継続（4回目）</div>
                </div>
                <div
                  className={`
                    p-4 border rounded-lg cursor-pointer transition flex items-center
                    ${sessionTypeOption === '継続（5回目）' 
                      ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                    }
                  `}
                  onClick={() => handleSessionTypeOptionSelect('継続（5回目）')}
                >
                  <span className="material-icons mr-3 text-[24px]">looks_5</span>
                  <div className="font-semibold">継続（5回目）</div>
                </div>
                <div
                  className={`
                    p-4 border rounded-lg cursor-pointer transition flex items-center
                    ${sessionTypeOption === '継続（6回目）' 
                      ? 'border-[#c50502] bg-red-50 text-[#c50502]' 
                      : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                    }
                  `}
                  onClick={() => handleSessionTypeOptionSelect('継続（6回目）')}
                >
                  <span className="material-icons mr-3 text-[24px]">looks_6</span>
                  <div className="font-semibold">継続（6回目）</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Button
              variant="primary"
              size="lg"
              disabled={!selectedDate || !selectedTimeSlot || !sessionType || !sessionTypeOption || isLoading}
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
            <p><span className="text-gray-600">セッション種別：</span> {sessionTypeOption}</p>
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
            <span className="material-icons text-green-600 text-[32px]">check</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">予約が完了しました</h2>
          
          <div className="max-w-md mx-auto bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">予約内容</h3>
            <div className="text-left text-green-700">
              <p><span className="font-medium">日時:</span> {formatDate(selectedDate)} {selectedTimeSlot.time}</p>
              <p><span className="font-medium">お名前:</span> {userInfo.name} 様</p>
              <p><span className="font-medium">セッション形式:</span> {sessionType === 'offline' ? '対面' : 'オンライン'}</p>
              <p><span className="font-medium">セッション種別:</span> {sessionTypeOption}</p>
              {reservationData && reservationData.meetUrl && (
                <p className="mt-2"><span className="font-medium">Google Meet URL:</span> 
                  <a href={reservationData.meetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    {reservationData.meetUrl}
                  </a>
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-8">
            <div className="flex items-start">
              <span className="material-icons text-blue-600 mr-2 mt-1">mail</span>
              <div className="text-left">
                <p className="font-medium text-blue-800 mb-1">予約確認メール送信済み</p>
                <p className="text-blue-700 text-sm">
                  {userInfo.email} 宛に予約内容の確認メールをお送りしました。ご確認ください。
                </p>
              </div>
            </div>
          </div>

          <p className="text-lg font-medium text-gray-800 mb-6">
            当日のセッションを楽しみにしております。
          </p>

          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setSelectedDate(null);
                setSelectedTimeSlot(null);
                setSessionType(null);
                setSessionTypeOption(null);
                setUserInfo({
                  name: '',
                  email: '',
                  phone: '',
                  remarks: ''
                });
                setReservationData(null);
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