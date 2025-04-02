import { useState } from 'react';
import Head from 'next/head';
import ReservationSystem from '../../components/sessions/ReservationSystem';

export default function PublicReservationPage() {
  return (
    <>
      <Head>
        <title>セッション予約 | マインドエンジニアリング・コーチング</title>
        <meta name="description" content="マインドエンジニアリング・コーチングのセッション予約ページです。" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-16">
              <h1 className="text-xl font-bold text-[#c50502]">
                マインドエンジニアリング・コーチング
              </h1>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <ReservationSystem />
        </main>
        
        <footer className="mt-12 border-t bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} マインドエンジニアリング・コーチング 森山雄太
          </div>
        </footer>
      </div>
    </>
  );
}

// この公開ページは認証をスキップするための設定
export async function getServerSideProps(context) {
  return {
    props: {
      // 公開ページ用のプロパティ
      forceAccess: true 
    },
  };
}