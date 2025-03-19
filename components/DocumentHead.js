import Head from 'next/head';

/**
 * 共通のHeadコンポーネント
 * 
 * @param {Object} props
 * @param {string} props.title - ページタイトル
 * @param {string} props.description - ページの説明
 * @param {boolean} props.noIndex - 検索エンジンにインデックスを許可しない場合はtrue
 */
export default function DocumentHead({ 
  title = 'マインドエンジニアリング・コーチング', 
  description = 'マインドエンジニアリング・コーチング業務管理システム',
  noIndex = false
}) {
  // タイトルの設定
  const fullTitle = title.includes('マインドエンジニアリング・コーチング') 
    ? title 
    : `${title} | マインドエンジニアリング・コーチング`;
  
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      
      {/* ファビコン（プレースホルダー - 実際のファビコンに置き換えてください） */}
      <link rel="icon" href="/favicon.ico" />
      
      {/* Apple Touch Icon（プレースホルダー） */}
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      
      {/* Material Icons - Googleフォント */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      
      {/* Noto Sans JP - Googleフォント */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet" />
      
      {/* テーマカラー */}
      <meta name="theme-color" content="#c50502" />
      
      {/* 検索エンジンのインデックス設定 */}
      {noIndex && <meta name="robots" content="noindex" />}
    </Head>
  );
}