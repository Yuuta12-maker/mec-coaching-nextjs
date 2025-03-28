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
const COLLECTION_NAME = 'sessions';

// セッション一覧を取得
export const getSessions = async () => {
  try {
    const sessionsRef = collection(db, COLLECTION_NAME);
    const q = query(sessionsRef, orderBy('sessionDate', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Firestoreのタイムスタンプをシリアライズ可能な形式に変換
      sessionDate: doc.data().sessionDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null,
    }));
  } catch (error) {
    console.error('Error getting sessions:', error);
    throw error;
  }
};

// クライアントのセッション一覧を取得
export const getSessionsByClientId = async (clientId) => {
  try {
    const sessionsRef = collection(db, COLLECTION_NAME);
    const q = query(
      sessionsRef, 
      where('clientId', '==', clientId),
      orderBy('sessionDate', 'desc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sessionDate: doc.data().sessionDate?.toDate?.() || null,
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null,
    }));
  } catch (error) {
    console.error('Error getting sessions by client ID:', error);
    throw error;
  }
};

// セッション取得（ID指定）
export const getSessionById = async (id) => {
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
      sessionDate: data.sessionDate?.toDate?.() || null,
      createdAt: data.createdAt?.toDate?.() || null,
      updatedAt: data.updatedAt?.toDate?.() || null,
    };
  } catch (error) {
    console.error('Error getting session by ID:', error);
    throw error;
  }
};

// セッション作成
export const createSession = async (sessionData) => {
  try {
    const customId = nanoid();
    
    // sessionDateをFirestoreのタイムスタンプに変換
    let formattedData = { ...sessionData };
    if (formattedData.sessionDate) {
      formattedData.sessionDate = new Date(formattedData.sessionDate);
    }
    
    const sessionRef = doc(db, COLLECTION_NAME, customId);
    await updateDoc(sessionRef, {
      ...formattedData,
      status: formattedData.status || 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      id: customId,
      ...formattedData
    };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// セッション更新
export const updateSession = async (id, sessionData) => {
  try {
    // sessionDateをFirestoreのタイムスタンプに変換
    let formattedData = { ...sessionData };
    if (formattedData.sessionDate) {
      formattedData.sessionDate = new Date(formattedData.sessionDate);
    }
    
    const sessionRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(sessionRef, {
      ...formattedData,
      updatedAt: serverTimestamp(),
    });
    
    return {
      id,
      ...formattedData
    };
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
};

// セッション削除
export const deleteSession = async (id) => {
  try {
    const sessionRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(sessionRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};
