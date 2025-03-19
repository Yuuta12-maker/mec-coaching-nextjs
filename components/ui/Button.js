import React from 'react';
import Link from 'next/link';

/**
 * 汎用ボタンコンポーネント
 * 通常のボタンとリンクボタンの両方として機能する
 * 
 * @param {Object} props
 * @param {string} props.variant - ボタンのスタイル種類 (primary, outline, success, danger, default)
 * @param {string} props.size - ボタンのサイズ (sm, md, lg)
 * @param {boolean} props.isLoading - ローディング状態かどうか
 * @param {boolean} props.isFullWidth - 幅100%で表示するかどうか
 * @param {string} props.href - リンク先（指定するとLinkコンポーネントになる）
 * @param {string} props.className - 追加のクラス名
 * @param {React.ReactNode} props.children - ボタンのコンテンツ
 */
export default function Button({ 
  variant = 'default', 
  size = 'md', 
  isLoading = false,
  isFullWidth = false,
  href,
  className = '',
  children,
  ...props 
}) {
  // バリアントに応じたクラス名を設定
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-white hover:bg-primary-dark focus:ring-primary';
      case 'outline':
        return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-300';
      case 'success':
        return 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500';
      default:
        return 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500';
    }
  };
  
  // サイズに応じたクラス名を設定
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default: // md
        return 'px-4 py-2 text-base';
    }
  };
  
  // ベースとなるクラス名
  const baseClasses = 'rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center shadow-sm';
  
  // 合成したクラス
  const buttonClasses = [
    baseClasses,
    getVariantClasses(),
    getSizeClasses(),
    isFullWidth ? 'w-full' : '',
    isLoading ? 'opacity-70 cursor-not-allowed' : '',
    className
  ].join(' ');
  
  // ローディングスピナー
  const renderSpinner = () => (
    <div className="mr-2">
      <div className={`spinner-sm border-white ${variant === 'outline' ? 'border-t-gray-600' : 'border-t-white'}`}></div>
    </div>
  );
  
  // リンクの場合
  if (href) {
    return (
      <Link href={href} className={buttonClasses} {...props}>
        {isLoading && renderSpinner()}
        {children}
      </Link>
    );
  }
  
  // 通常のボタンの場合
  return (
    <button 
      className={buttonClasses}
      disabled={isLoading}
      {...props}
    >
      {isLoading && renderSpinner()}
      {children}
    </button>
  );
}