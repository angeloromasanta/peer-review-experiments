
// components/student/Instructions.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Instructions() {
  const { user } = useAuth();
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const fetchInstructions = async () => {
      if (!user?.group) return;
      
      try {
        const instructionsDoc = await getDoc(doc(db, 'instructions', user.group));
        if (instructionsDoc.exists()) {
          setInstructions(instructionsDoc.data().content);
        }
      } catch (error) {
        console.error('Error fetching instructions:', error);
      }
    };

    fetchInstructions();
  }, [user?.group]);

  if (!user?.group) {
    return <div>Waiting for group assignment...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Instructions - Group {user.group}</h2>
      <div className="prose">
        {instructions ? (
          <div dangerouslySetInnerHTML={{ __html: instructions }} />
        ) : (
          <div>Loading instructions...</div>
        )}
      </div>
    </div>
  );
}