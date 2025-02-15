
// components/student/Submission.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

// Fix 3: Define component as a named function
const Submission = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;
  
  if (user.submissionId) {
    return <div>Your submission has been recorded. Please wait for the peer review phase.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.group) return;

    setIsSubmitting(true);
    try {
      // Create submission document
      const submissionRef = doc(db, 'submissions', crypto.randomUUID());
      await setDoc(submissionRef, {
        userId: user.uid,
        group: user.group,
        content,
        timestamp: new Date()
      });

      // Update user with submission ID
      await updateDoc(doc(db, 'users', user.uid), {
        submissionId: submissionRef.id
      });
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting response');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Submit Your Response</h2>
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-48 p-2 border rounded"
          placeholder="Enter your response here..."
          required
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

// Fix 4: Add explicit default export
export default Submission;