import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  saveCustomerProfile,
  getCustomerProfile,
  CustomerProfile,
} from '../lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  customerProfile: CustomerProfile | null;
  loading: boolean;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  customerProfile: null,
  loading: true,
  signUpWithEmail: async () => {},
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  sendPasswordReset: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string, fallbackName?: string, fallbackEmail?: string) => {
    try {
      const profile = await getCustomerProfile(uid);
      if (profile) {
        setCustomerProfile(profile);
      } else if (fallbackEmail) {
        const newProfile: CustomerProfile = {
          displayName: fallbackName || fallbackEmail.split('@')[0],
          email: fallbackEmail,
        };
        await saveCustomerProfile(uid, newProfile);
        setCustomerProfile(newProfile);
      }
    } catch {
      // Fallback local representation if offline
      if (fallbackEmail) {
        setCustomerProfile({
          displayName: fallbackName || fallbackEmail.split('@')[0],
          email: fallbackEmail,
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser.displayName || '', currentUser.email || '');
      } else {
        setCustomerProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user.displayName || '', user.email || '');
    }
  };

  const signUpWithEmail = async (fullName: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user) {
      if (fullName.trim()) {
        await updateProfile(cred.user, { displayName: fullName.trim() });
      }
      const newProfile: CustomerProfile = {
        displayName: fullName.trim(),
        email: email.trim(),
      };
      await saveCustomerProfile(cred.user.uid, newProfile);
      setCustomerProfile(newProfile);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (cred.user) {
      await fetchProfile(cred.user.uid, cred.user.displayName || '', cred.user.email || '');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        await fetchProfile(cred.user.uid, cred.user.displayName || '', cred.user.email || '');
      }
    } catch (err: any) {
      // Re-throw to be handled by the component
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setCustomerProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customerProfile,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
