
// components/student/PeerReview.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, query, where, collection, setDoc } from 'firebase/firestore';
import type { Submission } from '@/types';

interface PeerReviewProps {
  round: number;
}

export default function PeerReview({ round }: PeerReviewProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<[Submission | null, Submission | null]>([null, null]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ novel: 'A' | 'B' | null, feasible: 'A' | 'B' | null }>({
    novel: null,
    feasible: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;

      try {
        // Get already reviewed submissions for this round
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('reviewerId', '==', user.uid),
          where('round', '==', round)
        );
        const reviewedDocs = await getDocs(reviewsQuery);
        const reviewedIds = new Set(reviewedDocs.docs.flatMap(doc => [
          doc.data().submissionAId,
          doc.data().submissionBId
        ]));

        // Get submissions excluding user's own and already reviewed
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('userId', '!=', user.uid)
        );
        const submissionDocs = await getDocs(submissionsQuery);
        const availableSubmissions = submissionDocs.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Submission))
          .filter(sub => !reviewedIds.has(sub.id));

        // Randomly select one from each group
        const groupA = availableSubmissions.filter(sub => sub.group === 'A');
        const groupB = availableSubmissions.filter(sub => sub.group === 'B');
        
        if (groupA.length === 0 || groupB.length === 0) {
          setSubmissions([null, null]);
          return;
        }

        setSubmissions([
          groupA[Math.floor(Math.random() * groupA.length)],
          groupB[Math.floor(Math.random() * groupB.length)]
        ]);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user, round]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !submissions[0] || !submissions[1] || !selected.novel || !selected.feasible) return;

    setIsSubmitting(true);
    try {
      const reviewId = crypto.randomUUID();
      await setDoc(doc(db, 'reviews', reviewId), {
        reviewerId: user.uid,
        submissionAId: submissions[0].id,
        submissionBId: submissions[1].id,
        round,
        moreNovel: selected.novel,
        moreFeasible: selected.feasible,
        timestamp: new Date()
      });

      // Reset selections and fetch new submissions
      setSelected({ novel: null, feasible: null });
      setSubmissions([null, null]);
      setLoading(true);
      
      // Fetch new submissions (this will trigger the useEffect)
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading submissions...</div>;
  }

  if (!submissions[0] || !submissions[1]) {
    return <div>No more submissions to review for this round.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Peer Review - Round {round}</h2>
      
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Submission A */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Submission A</h3>
          <div className="whitespace-pre-wrap mb-4">
            {submissions[0].content}
          </div>
        </div>

        {/* Submission B */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Submission B</h3>
          <div className="whitespace-pre-wrap mb-4">
            {submissions[1].content}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Novelty Selection */}
        <div>
          <h3 className="font-semibold mb-2">Which submission is more novel?</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="novel"
                value="A"
                checked={selected.novel === 'A'}
                onChange={() => setSelected(prev => ({ ...prev, novel: 'A' }))}
                className="mr-2"
                required
              />
              Submission A
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="novel"
                value="B"
                checked={selected.novel === 'B'}
                onChange={() => setSelected(prev => ({ ...prev, novel: 'B' }))}
                className="mr-2"
                required
              />
              Submission B
            </label>
          </div>
        </div>

        {/* Feasibility Selection */}
        <div>
          <h3 className="font-semibold mb-2">Which submission is more feasible?</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="feasible"
                value="A"
                checked={selected.feasible === 'A'}
                onChange={() => setSelected(prev => ({ ...prev, feasible: 'A' }))}
                className="mr-2"
                required
              />
              Submission A
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="feasible"
                value="B"
                checked={selected.feasible === 'B'}
                onChange={() => setSelected(prev => ({ ...prev, feasible: 'B' }))}
                className="mr-2"
                required
              />
              Submission B
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selected.novel || !selected.feasible}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}