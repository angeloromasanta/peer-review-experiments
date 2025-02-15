// components/admin/Controls.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, collection, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import type { Activity } from '@/types';

interface ControlsProps {
  activity: Activity | null;
}

export default function Controls({ activity }: ControlsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const initializeActivity = async () => {
    setIsLoading(true);
    try {
      // Try to create the activity document
      await setDoc(doc(db, 'activities', 'current'), {
        status: 'registration',
        currentRound: 1,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Error creating activity');
    } finally {
      setIsLoading(false);
    }
  };

  const updateActivityStatus = async (newStatus: Activity['status'], currentRound = 1) => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'activities', 'current'), {
        status: newStatus,
        currentRound,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating activity:', error);
      alert('Error updating activity status');
    } finally {
      setIsLoading(false);
    }
  };

  const randomizeGroups = async () => {
    setIsLoading(true);
    try {
      console.log('Starting group randomization...');
      
      const usersSnap = await getDocs(collection(db, 'users'));
      const registeredUsers = usersSnap.docs.filter(doc => {
        const userData = doc.data();
        return userData.role === 'student'; // Changed this condition
      });
      
      console.log('Found registered users:', registeredUsers.length);
  
      const batch = writeBatch(db);
      registeredUsers.forEach((userDoc, index) => {
        const group = index % 2 === 0 ? 'A' : 'B';
        const userData = userDoc.data();
        console.log(`Assigning user ${userDoc.id} to group ${group}`, {
          currentData: userData
        });
        
        // Update the entire user document to ensure consistency
        batch.set(doc(db, 'users', userDoc.id), { 
          ...userData,
          group,
          registered: true,
          role: 'student',
          timestamp: new Date(),
          submissionId: null
        }, { merge: true });
      });
  
      console.log('Committing batch updates...');
      await batch.commit();
      console.log('Batch commit completed');
  
      // Double-check the update
      const verifyUser = await getDoc(doc(db, 'users', registeredUsers[0].id));
      console.log('Verified user update:', verifyUser.data());
      
      await updateActivityStatus('instructions');
      console.log('Activity status updated to instructions');
    } catch (error) {
      console.error('Error in randomizeGroups:', error);
      alert('Error assigning groups');
    } finally {
      setIsLoading(false);
    }
  };


  // In Controls.tsx, replace the resetActivity function with:

const resetActivity = async () => {
  if (!confirm('Are you sure you want to reset the activity? This will delete all students and their data.')) {
    return;
  }

  setIsLoading(true);
  try {
    const batch = writeBatch(db);

    // Delete all student users but keep admin
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.docs.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData.role === 'student') {
        batch.delete(doc(db, 'users', userDoc.id));
      }
    });

    // Delete all submissions
    const submissionsSnap = await getDocs(collection(db, 'submissions'));
    submissionsSnap.docs.forEach(submissionDoc => {
      batch.delete(doc(db, 'submissions', submissionDoc.id));
    });

    // Delete all reviews
    const reviewsSnap = await getDocs(collection(db, 'reviews'));
    reviewsSnap.docs.forEach(reviewDoc => {
      batch.delete(doc(db, 'reviews', reviewDoc.id));
    });

    // Reset activity
    batch.update(doc(db, 'activities', 'current'), {
      status: 'registration',
      currentRound: 1,
      timestamp: new Date()
    });

    await batch.commit();
  } catch (error) {
    console.error('Error resetting activity:', error);
    alert('Error resetting activity');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Activity Controls</h2>
      
      <div className="flex flex-col gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Current Status</h3>
          <p>{activity?.status || 'Not started'}</p>
          {activity?.status === 'review' && (
            <p className="text-sm text-gray-600">Round {activity.currentRound}</p>
          )}
        </div>

        <div className="space-x-4">
          {!activity?.status && (
            <button
              onClick={initializeActivity}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              Start Activity
            </button>
          )}

          {activity?.status === 'registration' && (
            <button
              onClick={randomizeGroups}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              End Registration & Randomize
            </button>
          )}

          {activity?.status === 'instructions' && (
            <button
              onClick={() => updateActivityStatus('submission')}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Start Submission Phase
            </button>
          )}

{activity?.status === 'submission' && (
  <button
    onClick={() => updateActivityStatus('review', 1)}
    disabled={isLoading}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
  >
    Start Review Round 1
  </button>
)}

{activity?.status === 'review' && (
  <>
    <button
      onClick={() => updateActivityStatus('review', activity.currentRound + 1)}
      disabled={isLoading}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      Start Round {activity.currentRound + 1}
    </button>
    <button
      onClick={() => updateActivityStatus('completed')}
      disabled={isLoading}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
    >
      End Reviews
    </button>
  </>
)}

          <button
            onClick={resetActivity}
            disabled={isLoading}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            Reset Activity
          </button>
        </div>
      </div>
    </div>
  );
}