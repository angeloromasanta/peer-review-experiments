
// components/student/Registration.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function Registration() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegistration = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        registered: true,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Registration error:', error);
      alert('Error registering for activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.registered) {
    return <div>You are registered. Please wait for instructions.</div>;
  }

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Register for Activity</h2>
      <button
        onClick={handleRegistration}
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </div>
  );
}
