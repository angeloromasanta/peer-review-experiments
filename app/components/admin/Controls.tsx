
// components/admin/Controls.tsx
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import type { Activity } from '@/types';

interface ControlsProps {
  activity: Activity | null;
}

export default function Controls({ activity }: ControlsProps) {
  const [isLoading, setIsLoading] = useState(false);

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
      const usersSnap = await getDocs(collection(db, 'users'));
      const registeredUsers = usersSnap.docs.filter(doc => 
        doc.data().registered && doc.data().role === 'student'
      );

      const batch = writeBatch(db);
      registeredUsers.forEach((userDoc, index) => {
        const group = index % 2 === 0 ? 'A' : 'B';
        batch.update(doc(db, 'users', userDoc.id), { group });
      });

      await batch.commit();
      await updateActivityStatus('instructions');
    } catch (error) {
      console.error('Error randomizing groups:', error);
      alert('Error assigning groups');
    } finally {
      setIsLoading(false);
    }
  };

  const resetActivity = async () => {
    if (!confirm('Are you sure you want to reset the activity? This will delete all submissions and reviews.')) {
      return;
    }

    setIsLoading(true);
    try {
      const batch = writeBatch(db);

      // Reset users
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.docs.forEach(userDoc => {
        batch.update(doc(db, 'users', userDoc.id), {
          registered: false,
          group: null,
          submissionId: null
        });
      });

      // Delete submissions
      const submissionsSnap = await getDocs(collection(db, 'submissions'));
      submissionsSnap.docs.forEach(submissionDoc => {
        batch.delete(doc(db, 'submissions', submissionDoc.id));
      });

      // Delete reviews
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

          {activity?.status === 'review' && activity.currentRound === 1 && (
            <button
              onClick={() => updateActivityStatus('review', 2)}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Start Review Round 2
            </button>
          )}

          {activity?.status === 'review' && activity.currentRound === 2 && (
            <button
              onClick={() => updateActivityStatus('completed')}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              End Activity
            </button>
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