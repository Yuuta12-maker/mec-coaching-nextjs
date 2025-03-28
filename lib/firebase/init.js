import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  getDocs
} from 'firebase/firestore';

/**
 * Firebase Firestoreの初期化と必要なコレクションやドキュメントのセットアップを行う
 */
export const initializeFirestore = async () => {
  try {
    console.log('Firestoreの初期化を開始します...');
    
    // 各コレクションが存在するか確認
    const collections = ['clients', 'sessions', 'receipts', 'emailLogs'];
    
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      console.log(`コレクション '${collectionName}' は ${snapshot.empty ? '空です' : `${snapshot.size} ドキュメントがあります`}`);
    }
    
    // 設定ドキュメントが存在するか確認、なければ作成
    const configRef = doc(db, 'settings', 'appConfig');
    const configDoc = await getDoc(configRef);
    
    if (!configDoc.exists()) {
      console.log('設定ドキュメントを作成します...');
      
      await setDoc(configRef, {
        serviceName: 'マインドエンジニアリング・コーチング',
        adminEmail: 'mindengineeringcoaching@gmail.com',
        corporateColor: '#c50502',
        createdAt: new Date(),
        updatedAt: new Date(),
        defaultSettings: {
          trialFee: 6000,
          continuationFee: 214000,
          fullProgramFee: 220000,
          taxRate: 10,
          issuerName: '森山雄太',
          issuerTitle: 'マインドエンジニアリング・コーチング',
          issuerAddress: '〒790-0012 愛媛県松山市湊町2-5-2リコオビル401'
        }
      });
      
      console.log('設定ドキュメントを作成しました');
    } else {
      console.log('設定ドキュメントは既に存在します');
    }
    
    console.log('Firestoreの初期化が完了しました');
    return true;
  } catch (error) {
    console.error('Firestoreの初期化に失敗しました:', error);
    throw error;
  }
};
