import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

// 最小限の緊急アクセス用ページ
export default function SimpleBypass() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmergencyAccess = () => {
    if (typeof window !== 'undefined') {
      // ダッシュボードに直接遷移
      router.push('/');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f3f4f6' 
    }}>
      <Head>
        <title>緊急アクセス | MEC</title>
      </Head>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '32px', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          color: '#c50502', 
          fontSize: '24px', 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          マインドエンジニアリング・コーチング
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '24px',
          color: '#4b5563'
        }}>
          緊急アクセス
        </p>
        
        <button
          onClick={handleEmergencyAccess}
          style={{
            width: '100%',
            backgroundColor: '#c50502',
            color: 'white',
            padding: '10px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          システムにアクセス
        </button>
      </div>
    </div>
  );
}