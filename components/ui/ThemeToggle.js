import { useState, useEffect } from 'react';

const ThemeToggle = () => {
  // テーマの状態を管理
  const [darkMode, setDarkMode] = useState(false);

  // コンポーネントがマウントされたときに初期テーマを設定
  useEffect(() => {
    // localStorage からテーマを取得
    const savedTheme = localStorage.getItem('mec-theme');
    
    // ユーザーが保存したテーマ設定があるか確認
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } 
    // なければシステム設定をチェック
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('mec-theme', 'dark');
    }
  }, []);

  // テーマを切り替える関数
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mec-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mec-theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
      aria-label={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      title={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    >
      {darkMode ? (
        <span className="material-icons text-amber-400">light_mode</span>
      ) : (
        <span className="material-icons text-slate-700">dark_mode</span>
      )}
    </button>
  );
};

export default ThemeToggle;