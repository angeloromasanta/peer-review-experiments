// app/student/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Activity } from '@/types';

import Instructions from '@/components/student/Instructions';
import Submission from '@/components/student/Submission';
import PeerReview from '@/components/student/PeerReview';

const StudentDashboard = () => {
  const { user, loading } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);

  useEffect(() => {
    // Subscribe to current activity
    const unsubscribe = onSnapshot(doc(db, 'activities', 'current'), (doc) => {
      if (doc.exists()) {
        setActivity({ id: doc.id, ...doc.data() } as Activity);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  const renderCurrentStage = () => {
    if (!activity) return <div>Waiting for activity to start...</div>;

    switch (activity.status) {
      case 'registration':
        return <div>Activity registration is open. Please wait for further instructions.</div>;
      case 'instructions':
        return <Instructions />;
      case 'submission':
        return <Submission />;
      case 'review':
        return <PeerReview round={activity.currentRound} />;
      case 'completed':
        return <div>Activity completed. Thank you for participating!</div>;
      default:
        return <div>Unknown stage</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
        <div className="mb-4">
          Welcome, {user.name}
        </div>
        {activity?.status === 'review' && (
          <div className="mb-4 p-2 bg-blue-50 rounded">
            <p className="text-blue-800">Current Review Round: {activity.currentRound}</p>
          </div>
        )}
        {renderCurrentStage()}
      </div>
    </div>
  );
};

export default StudentDashboard;