import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  getDocFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with configured firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standardized error handler required by security rules framework
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Startup connection verification
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or configuration pending.');
    }
    return false;
  }
}
testFirestoreConnection();

// Customer Profile shape
export interface CustomerProfile {
  displayName: string;
  email: string;
  createdAt?: any;
}

// Customer Saved Order shape
export interface SavedOrder {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerEmail?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryZone: 'inside_dhaka' | 'outside_dhaka';
  deliveryFee: number;
  subtotal: number;
  total: number;
  paymentMethod: 'cod' | 'bkash';
  status: 'Pending Confirmation' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Pending';
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
    lineTotal: number;
  }[];
  createdAt: any;
}

/**
 * Creates or updates customer profile in users collection
 */
export async function saveCustomerProfile(userId: string, data: { displayName: string; email: string }) {
  const userPath = `users/${userId}`;
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        displayName: data.displayName,
        email: data.email,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

/**
 * Fetches customer profile
 */
export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const userPath = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as CustomerProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

/**
 * Saves order to Firestore collection 'orders'
 */
export async function saveOrderToFirestore(orderData: Omit<SavedOrder, 'id'>): Promise<string> {
  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const orderPath = `orders/${orderId}`;
  try {
    await setDoc(doc(db, 'orders', orderId), {
      ...orderData,
      createdAt: new Date().toISOString(),
    });
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, orderPath);
  }
}

/**
 * Queries orders placed by a specific customer
 */
export async function getCustomerOrders(userId: string): Promise<SavedOrder[]> {
  const ordersPath = 'orders';
  try {
    const q = query(collection(db, 'orders'), where('customerId', '==', userId));
    const snapshot = await getDocs(q);
    const orders: SavedOrder[] = [];
    snapshot.forEach((docSnap) => {
      orders.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<SavedOrder, 'id'>),
      });
    });
    // Sort newest first
    orders.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ordersPath);
  }
}
