module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // エスケープされていない引用符を許可（JSXで必要な場合）
    'react/no-unescaped-entities': 'off',
    
    // デフォルトエクスポートの匿名オブジェクトを許可
    'import/no-anonymous-default-export': 'off',
  },
};