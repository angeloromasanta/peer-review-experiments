'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Initialize instructions if they don't exist
const initializeInstructions = async () => {
  try {
    // Group A instructions
    await setDoc(doc(db, 'instructions', 'A'), {
      content: `
        <h3>Instructions for Group A</h3>
        <p>Please provide an innovative solution to reduce plastic waste in oceans.</p>
        <ul>
          <li>Focus on practical implementation</li>
          <li>Consider cost-effectiveness</li>
          <li>Think about scalability</li>
        </ul>
      `
    }, { merge: true });

    // Group B instructions
    await setDoc(doc(db, 'instructions', 'B'), {
      content: `
        <h3>Instructions for Group B</h3>
        <p>Please provide an innovative solution to reduce carbon emissions in cities.</p>
        <ul>
          <li>Focus on immediate impact</li>
          <li>Consider local implementation</li>
          <li>Think about community adoption</li>
        </ul>
      `
    }, { merge: true });

    console.log('Instructions initialized successfully');
  } catch (error) {
    console.error('Error initializing instructions:', error);
  }
};

export default function Instructions() {
  const { user } = useAuth();
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInstructions = async () => {
      if (!user?.group) {
        setLoading(false);
        return;
      }

      try {
        // Initialize instructions first
        await initializeInstructions();
        
        // Then fetch the appropriate instructions
        const instructionsDoc = await getDoc(doc(db, 'instructions', user.group));
        if (instructionsDoc.exists()) {
          setInstructions(instructionsDoc.data().content);
        } else {
          setError('Instructions not found for your group');
        }
      } catch (error) {
        console.error('Error fetching instructions:', error);
        setError('Error loading instructions');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructions();
  }, [user?.group]);

  // Debug information
  console.log('Current user:', user);
  console.log('User group:', user?.group);
  console.log('Instructions loaded:', instructions ? 'Yes' : 'No');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading instructions...</p>
        </div>
      </div>
    );
  }

  if (!user?.group) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Waiting for Group Assignment</h3>
        <div className="space-y-2">
          <p className="text-sm text-yellow-600">Your user ID: {user?.uid}</p>
          <p className="text-sm text-yellow-600">Current group status: {user?.group || 'Not assigned'}</p>
          <p className="text-sm text-yellow-600">Please wait while the administrator assigns you to a group.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Instructions - Group {user.group}
          </h2>
          <div className="prose prose-blue max-w-none">
            {instructions ? (
              <div dangerouslySetInnerHTML={{ __html: instructions }} />
            ) : (
              <div className="text-gray-500">
                No instructions available for your group.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}