/**
 * CORELUX — Firebase Configuration
 * 
 * You can easily paste or update your Firebase project API keys here manually
 * for cPanel (Apache) static hosting or any custom hosting deployment.
 * 
 * To get your keys from Firebase:
 * 1. Open Firebase Console (https://console.firebase.google.com/)
 * 2. Go to Project Settings -> General -> Your apps -> Web app
 * 3. Copy the firebaseConfig object and paste values below.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDFctuQzrhqTgqQ0r7ZowRen_NQW3kvShw",
  authDomain: "ai-studio-applet-webapp-c426e.firebaseapp.com",
  projectId: "ai-studio-applet-webapp-c426e",
  storageBucket: "ai-studio-applet-webapp-c426e.firebasestorage.app",
  messagingSenderId: "506976697606",
  appId: "1:506976697606:web:4173276e186b89a4d57287",
  firestoreDatabaseId: "ai-studio-coreluxpremiumst-259becfb-ac26-4b2a-8043-a0d6f49e9c75",
};

export default firebaseConfig;
