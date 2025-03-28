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
const COLLECTION_NAME = 'clients';

// クライアント一覧を取得
export const getClients = async () => {
  try {
    const clientsRef = collection(db, COLLECTION_NAME);
    const q = query(clientsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Firestoreのタイムスタンプをシリアライズ可能な形式に変換
      createdAt: doc.data().createdAt?.toDate?.() || null,
      updatedAt: doc.data().updatedAt?.toDate?.() || null,
      birthDate: doc.data().birthDate?.toDate?.() || null,
    }));
  } catch (error) {
    console.error('Error getting clients:', error);
    throw error;
  }
};

// クライアント取得（ID指定）
export const getClientById = async (id) => {
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
      createdAt: data.createdAt?.toDate?.() || null,
      updatedAt: data.updatedAt?.toDate?.() || null,
      birthDate: data.birthDate?.toDate?.() || null,
    };
  } catch (error) {
    console.error('Error getting client by ID:', error);
    throw error;
  }
};

// クライアント作成
export const createClient = async (clientData) => {
  try {
    const customId = nanoid();
    
    // birthDateをFirestoreのタイムスタンプに変換
    let formattedData = { ...clientData };
    if (formattedData.birthDate) {
      formattedData.birthDate = new Date(formattedData.birthDate);
    }
    
    const clientRef = doc(db, COLLECTION_NAME, customId);
    await updateDoc(clientRef, {
      ...formattedData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return {
      id: customId,
      ...formattedData
    };
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

// クライアント更新
export const updateClient = async (id, clientData) => {
  try {
    // birthDateをFirestoreのタイムスタンプに変換
    let formattedData = { ...clientData };
    if (formattedData.birthDate) {
      formattedData.birthDate = new Date(formattedData.birthDate);
    }
    
    const clientRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(clientRef, {
      ...formattedData,
      updatedAt: serverTimestamp(),
    });
    
    return {
      id,
      ...formattedData
    };
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

// クライアント削除
export const deleteClient = async (id) => {
  try {
    const clientRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(clientRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};
