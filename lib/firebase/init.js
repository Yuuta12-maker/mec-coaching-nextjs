// ダミーの初期化関数
export const initializeFirestore = async () => {
  console.log('Firestore初期化はスキップされました（ローカルストレージ方式に移行）');
  return true;
};

// Firestore初期化は不要になりました
export default function FirebaseInitializer({ children }) {
  // 子コンポーネントをそのまま返す
  return children;
}