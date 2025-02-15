// app/student/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Activity } from '@/types';
// Fix 1: Ensure correct import paths with explicit file extensions
import Registration from '@/components/student/Registration';
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
        return <Registration />;
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
        {renderCurrentStage()}
      </div>
    </div>
  );
};

// Fix 2: Add explicit default export
export default StudentDashboard;
