// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import type { Activity, User } from '@/types';
import Controls from '@/components/admin/Controls';
import Results from '@/components/admin/Results';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [stats, setStats] = useState({
    registeredUsers: 0,
    submissions: 0,
    reviews: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Subscribe to current activity
    const unsubActivity = onSnapshot(doc(db, 'activities', 'current'), (doc) => {
      if (doc.exists()) {
        setActivity({ id: doc.id, ...doc.data() } as Activity);
      }
    });

    // Subscribe to stats
    const unsubStats = onSnapshot(collection(db, 'users'), async (snapshot) => {
      const registeredUsers = snapshot.docs.filter(doc => doc.data().registered).length;
      
      const submissionsQuery = query(collection(db, 'submissions'));
      const submissionsSnap = await getDocs(submissionsQuery);
      
      const reviewsQuery = query(collection(db, 'reviews'));
      const reviewsSnap = await getDocs(reviewsQuery);

      setStats({
        registeredUsers,
        submissions: submissionsSnap.size,
        reviews: reviewsSnap.size
      });
    });

    return () => {
      unsubActivity();
      unsubStats();
    };
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <div>Access denied</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="text-sm font-semibold text-blue-800">Registered Users</h3>
            <p className="text-2xl">{stats.registeredUsers}</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h3 className="text-sm font-semibold text-green-800">Submissions</h3>
            <p className="text-2xl">{stats.submissions}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <h3 className="text-sm font-semibold text-purple-800">Reviews</h3>
            <p className="text-2xl">{stats.reviews}</p>
          </div>
        </div>

        {/* Activity Controls */}
        <Controls activity={activity} />

        {/* Results */}
        {activity?.status === 'completed' && <Results />}
      </div>
    </div>
  );
}
