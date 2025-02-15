// components/admin/Controls.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc, collection, getDocs, query, where, onSnapshot, writeBatch } from 'firebase/firestore';
import type { Activity, User, Submission, Review } from '@/types';

interface ControlsProps {
  activity: Activity | null;
}

interface UserStatus extends User {
  hasSubmitted?: boolean;
  hasReviewed?: boolean;
}

export default function Controls({ activity }: ControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserStatus[]>([]);

  // Subscribe to users, submissions, and reviews
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users'), where('role', '==', 'student')),
      async (snapshot) => {
        const usersList: UserStatus[] = [];
        
        for (const doc of snapshot.docs) {
          const userData = { uid: doc.id, ...doc.data() } as User;
          
          // Get submission status if in submission phase
          let hasSubmitted = false;
          if (activity?.status === 'submission' || activity?.status === 'review') {
            const submissionQuery = query(
              collection(db, 'submissions'),
              where('userId', '==', doc.id)
            );
            const submissionDocs = await getDocs(submissionQuery);
            hasSubmitted = !submissionDocs.empty;
          }
          
          // Get review status if in review phase
          let hasReviewed = false;
          if (activity?.status === 'review') {
            const reviewQuery = query(
              collection(db, 'reviews'),
              where('reviewerId', '==', doc.id),
              where('round', '==', activity.currentRound)
            );
            const reviewDocs = await getDocs(reviewQuery);
            hasReviewed = !reviewDocs.empty;
          }
          
          usersList.push({
            ...userData,
            hasSubmitted,
            hasReviewed
          });
        }
        
        setUsers(usersList);
      }
    );

    return () => unsubscribeUsers();
  }, [activity?.status, activity?.currentRound]);

  const initializeActivity = async () => {
    setIsLoading(true);
    try {
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
      const batch = writeBatch(db);
      
      const usersSnap = await getDocs(collection(db, 'users'));
      const registeredUsers = usersSnap.docs.filter(doc => {
        const userData = doc.data();
        return userData.role === 'student';
      });
      
      registeredUsers.forEach((userDoc, index) => {
        const group = index % 2 === 0 ? 'A' : 'B';
        batch.update(doc(db, 'users', userDoc.id), { group });
      });
      
      await batch.commit();
      await updateActivityStatus('instructions');
    } catch (error) {
      console.error('Error in randomizeGroups:', error);
      alert('Error assigning groups');
    } finally {
      setIsLoading(false);
    }
  };

  const resetActivity = async () => {
    if (!confirm('Are you sure you want to reset the activity? This will remove all users and their data.')) {
      return;
    }

    setIsLoading(true);
    try {
      const batch = writeBatch(db);

      // Delete all users
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.docs.forEach(userDoc => {
        batch.delete(doc(db, 'users', userDoc.id));
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

  const startNewReviewRound = async () => {
    if (!activity) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'activities', 'current'), {
        status: 'review',
        currentRound: (activity.currentRound || 0) + 1,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error starting new review round:', error);
      alert('Error starting new review round');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Activity Controls</h2>
      
      {/* Status Display */}
      <div className="bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Current Status</h3>
        <p>{activity?.status || 'Not started'}</p>
        {activity?.status === 'review' && (
          <p className="text-sm text-gray-600">Round {activity.currentRound}</p>
        )}
      </div>

      {/* User Status Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
              {(activity?.status === 'submission' || activity?.status === 'review') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
              )}
              {activity?.status === 'review' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reviewed (Round {activity.currentRound})
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.uid}>
                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.group || '-'}</td>
                {(activity?.status === 'submission' || activity?.status === 'review') && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.hasSubmitted ? '✓' : '-'}
                  </td>
                )}
                {activity?.status === 'review' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.hasReviewed ? '✓' : '-'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Control Buttons */}
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
              onClick={startNewReviewRound}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Start Round {(activity.currentRound || 0) + 1}
            </button>
            <button
              onClick={() => updateActivityStatus('completed')}
              disabled={isLoading}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
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
  );
}