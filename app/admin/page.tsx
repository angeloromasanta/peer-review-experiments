// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, getDocs, query } from 'firebase/firestore';
import type { Activity } from '@/types';
import Controls from '@/components/admin/Controls';
import Results from '@/components/admin/Results';

const ADMIN_PASSWORD = '123456'; // You can change this to any password you want

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activity, setActivity] = useState<Activity | null>(null);
  const [stats, setStats] = useState({
    registeredUsers: 0,
    submissions: 0,
    reviews: 0
  });

  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      // Save to localStorage to persist admin access
      localStorage.setItem('adminAuthenticated', 'true');
    } else {
      alert('Incorrect password');
    }
  };

  // Check for stored authentication on component mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => {
              localStorage.removeItem('adminAuthenticated');
              setIsAuthenticated(false);
            }}
            className="text-red-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
        
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