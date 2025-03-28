import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

// コレクション名
const COLLECTION_NAME = 'emailLogs';

// メールログ一覧を取得
export const getEmailLogs = async () => {
  try {
    const logsRef = collection(db, COLLECTION_NAME);
    const q = query(logsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Firestoreのタイムスタンプをシリアライズ可能な形式に変換
      createdAt: doc.data().createdAt?.toDate?.() || null,
    }));
  } catch (error) {
    console.error('Error getting email logs:', error);
    throw error;
  }
};

// 特定のタイプのメールログを取得
export const getEmailLogsByType = async (type) => {
  try {
    const logsRef = collection(db, COLLECTION_NAME);
    const q = query(
      logsRef, 
      where('type', '==', type),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
    }));
  } catch (error) {
    console.error('Error getting email logs by type:', error);
    throw error;
  }
};

// メールログを作成
export const createEmailLog = async (logData) => {
  try {
    const id = nanoid();
    const logRef = doc(db, COLLECTION_NAME, id);
    
    await updateDoc(logRef, {
      ...logData,
      status: logData.status || 'sent',
      createdAt: serverTimestamp(),
    });
    
    return {
      id,
      ...logData
    };
  } catch (error) {
    console.error('Error creating email log:', error);
    throw error;
  }
};
