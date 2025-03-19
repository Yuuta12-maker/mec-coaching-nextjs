import React from 'react';

/**
 * カードコンポーネント
 * 
 * @param {Object} props
 * @param {boolean} props.isInteractive - インタラクティブなカードかどうか（ホバーエフェクト追加）
 * @param {string} props.className - 追加のクラス名
 * @param {React.ReactNode} props.children - カードの内容
 */
export default function Card({ 
  isInteractive = false,
  className = '',
  children,
  ...props 
}) {
  const baseClasses = 'bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-100 transition-all duration-200';
  const interactiveClasses = isInteractive ? 'hover:shadow-lg transform hover:-translate-y-1 cursor-pointer' : '';
  
  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * カードのヘッダー部分
 */
Card.Header = function CardHeader({ 
  className = '', 
  children,
  ...props 
}) {
  return (
    <div 
      className={`flex justify-between items-center mb-4 pb-3 border-b border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * カードのタイトル
 */
Card.Title = function CardTitle({ 
  className = '', 
  children,
  ...props 
}) {
  return (
    <h2 
      className={`text-lg font-semibold text-gray-800 ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
};

/**
 * カードの本文部分
 */
Card.Body = function CardBody({ 
  className = '', 
  children,
  ...props 
}) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

/**
 * カードのフッター部分
 */
Card.Footer = function CardFooter({ 
  className = '', 
  children,
  ...props 
}) {
  return (
    <div 
      className={`mt-4 pt-3 border-t border-gray-100 flex justify-end ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};