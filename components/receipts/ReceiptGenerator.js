import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CORPORATE_COLOR } from '../../lib/constants';

// PDFを生成するコンポーネント
export default function ReceiptGenerator({ formData, validateForm, amount, taxExcludedAmount, taxAmount, formattedDate }) {
  const [libsLoaded, setLibsLoaded] = useState(false);

  // 外部ライブラリのロード状態を監視
  useEffect(() => {
    let jsPdfLoaded = false;
    let html2canvasLoaded = false;

    function checkLibsLoaded() {
      if (typeof window !== 'undefined') {
        jsPdfLoaded = window.jspdf !== undefined;
        html2canvasLoaded = window.html2canvas !== undefined;
        
        if (jsPdfLoaded && html2canvasLoaded) {
          setLibsLoaded(true);
        }
      }
    }

    // 既にロードされているか確認
    checkLibsLoaded();

    // リスナーを設定（ライブラリがロードされた時に検知）
    window.addEventListener('jspdf-loaded', checkLibsLoaded);
    window.addEventListener('html2canvas-loaded', checkLibsLoaded);

    return () => {
      window.removeEventListener('jspdf-loaded', checkLibsLoaded);
      window.removeEventListener('html2canvas-loaded', checkLibsLoaded);
    };
  }, []);

  // PDF生成処理
  const generatePdf = async () => {
    if (!validateForm()) {
      return;
    }

    if (!libsLoaded) {
      alert('PDFライブラリを読み込み中です。しばらくお待ちください。');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const html2canvas = window.html2canvas;
      const receipt = document.getElementById('receipt');
      
      // スクロール位置を保存
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // html2canvasでキャプチャ
      const canvas = await html2canvas(receipt, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      // スクロール位置を復元
      window.scrollTo(scrollX, scrollY);
      
      // キャンバスから画像データを取得
      const imgData = canvas.toDataURL('image/png');
      
      // PDFを生成
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // ファイル名を設定
      const clientName = formData.clientName || 'クライアント';
      const today = new Date();
      const dateStr = today.getFullYear() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0');
      const filename = `領収書_${clientName}_${dateStr}.pdf`;
      
      // PDFを保存
      pdf.save(filename);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDFの生成中にエラーが発生しました。詳細はコンソールをご確認ください。');
    }
  };

  // 印刷処理
  const printReceipt = () => {
    if (!validateForm()) {
      return;
    }
    window.print();
  };

  return (
    <>
      {/* 外部ライブラリを読み込み */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        strategy="lazyOnload"
        onLoad={() => window.dispatchEvent(new Event('jspdf-loaded'))}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        strategy="lazyOnload"
        onLoad={() => window.dispatchEvent(new Event('html2canvas-loaded'))}
      />

      {/* ボタン */}
      <button
        onClick={generatePdf}
        className="px-4 py-2 rounded text-white font-medium mr-3"
        style={{ backgroundColor: CORPORATE_COLOR }}
        title={!libsLoaded ? "PDFライブラリを読み込み中です" : undefined}
      >
        PDF保存
      </button>
      <button
        onClick={printReceipt}
        className="px-4 py-2 rounded text-white font-medium bg-gray-600 hover:bg-gray-700"
      >
        印刷する
      </button>

      {/* 印刷用のスタイル */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          #receipt, #receipt * {
            visibility: visible;
          }
          
          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
          }
          
          button {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
