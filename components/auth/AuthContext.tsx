// components/auth/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Clean up previous subscription if it exists
        if (unsubscribeUser) {
          unsubscribeUser();
        }

        // Set up real-time listener for user document
        unsubscribeUser = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<User, 'uid'>;
              console.log('User data updated:', {
                uid: firebaseUser.uid,
                ...userData
              });
              setUser({
                uid: firebaseUser.uid,
                ...userData,
              });
            } else {
              console.log('No user document found');
              auth.signOut();
              setUser(null);
              router.push('/');
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error in user document listener:', error);
            auth.signOut();
            setUser(null);
            router.push('/');
            setLoading(false);
          }
        );
      } else {
        console.log('No Firebase user');
        if (unsubscribeUser) {
          unsubscribeUser();
        }
        setUser(null);
        router.push('/');
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);