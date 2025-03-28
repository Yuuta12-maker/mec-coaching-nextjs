import { db } from '../firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

// コレクション名
const COLLECTION_NAME = 'receipts';

// 領収書一覧を取得
export const getReceipts = async () => {
  try {
    const receiptsRef = collection(db, COLLECTION_NAME);
    const q = query(receiptsRef, orderBy('issueDate', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Firestoreのタイムスタンプをシリアライズ可能な形式に変換
      issueDate: doc.data().issueDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null,
    }));
  } catch (error) {
    console.error('Error getting receipts:', error);
    throw error;
  }
};

// クライアントの領収書一覧を取得
export const getReceiptsByClientId = async (clientId) => {
  try {
    const receiptsRef = collection(db, COLLECTION_NAME);
    const q = query(
      receiptsRef, 
      where('clientId', '==', clientId),
      orderBy('issueDate', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      issueDate: doc.data().issueDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null,
    }));
  } catch (error) {
    console.error('Error getting receipts by client ID:', error);
    throw error;
  }
};

// 領収書取得（ID指定）
export const getReceiptById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      issueDate: data.issueDate?.toDate?.() || null,
      createdAt: data.createdAt?.toDate?.() || null,
      updatedAt: data.updatedAt?.toDate?.() || null,
    };
  } catch (error) {
    console.error('Error getting receipt by ID:', error);
    throw error;
  }
};

// 領収書番号から領収書を取得
export const getReceiptByNumber = async (receiptNumber) => {
  try {
    const receiptsRef = collection(db, COLLECTION_NAME);
    const q = query(receiptsRef, where('receiptNumber', '==', receiptNumber));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      issueDate: data.issueDate?.toDate?.() || null,
      createdAt: data.createdAt?.toDate?.() || null,
      updatedAt: data.updatedAt?.toDate?.() || null,
    };
  } catch (error) {
    console.error('Error getting receipt by number:', error);
    throw error;
  }
};

// 領収書作成
export const createReceipt = async (receiptData) => {
  try {
    const id = nanoid();
    
    // 日付をFirestoreのTimestampに変換
    let formattedData = { ...receiptData };
    if (formattedData.issueDate) {
      formattedData.issueDate = new Date(formattedData.issueDate);
    }
    
    // 数値型に変換
    if (formattedData.amount) {
      formattedData.amount = Number(formattedData.amount);
    }
    if (formattedData.taxRate) {
      formattedData.taxRate = Number(formattedData.taxRate);
    }
    
    // ドキュメントを作成
    await setDoc(doc(db, COLLECTION_NAME, id), {
      ...formattedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      id,
      ...formattedData
    };
  } catch (error) {
    console.error('Error creating receipt:', error);
    throw error;
  }
};

// 領収書更新
export const updateReceipt = async (id, receiptData) => {
  try {
    // 日付をFirestoreのTimestampに変換
    let formattedData = { ...receiptData };
    if (formattedData.issueDate) {
      formattedData.issueDate = new Date(formattedData.issueDate);
    }
    
    // 数値型に変換
    if (formattedData.amount) {
      formattedData.amount = Number(formattedData.amount);
    }
    if (formattedData.taxRate) {
      formattedData.taxRate = Number(formattedData.taxRate);
    }
    
    const receiptRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(receiptRef, {
      ...formattedData,
      updatedAt: serverTimestamp(),
    });
    
    return {
      id,
      ...formattedData
    };
  } catch (error) {
    console.error('Error updating receipt:', error);
    throw error;
  }
};

// 領収書削除
export const deleteReceipt = async (id) => {
  try {
    const receiptRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(receiptRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting receipt:', error);
    throw error;
  }
};
