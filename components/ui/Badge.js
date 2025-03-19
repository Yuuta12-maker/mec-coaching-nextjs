import React from 'react';

// Badge変数型
// primary, success, warning, info, danger, default
// または独自のクラス名を指定可能

/**
 * バッジコンポーネント
 * 
 * @param {Object} props
 * @param {string} props.variant - バッジのスタイル種類 (primary, success, warning, info, danger, default)
 * @param {string} props.className - 追加のクラス名
 * @param {React.ReactNode} props.children - バッジのコンテンツ
 */
export default function Badge({ 
  variant = 'default', 
  className = '', 
  children, 
  ...props 
}) {
  // バリアントに応じたクラス名を設定
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary-ultralight text-primary';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'danger':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = getVariantClasses();
  
  return (
    <span 
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}