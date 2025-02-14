// components/admin/Results.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Submission, Review } from '@/types';

interface SubmissionStats {
  id: string;
  content: string;
  group: 'A' | 'B';
  noveltyScore: number;
  feasibilityScore: number;
  totalReviews: number;
}

export default function Results() {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionStats[]>([]);
  const [aggregateStats, setAggregateStats] = useState({
    groupA: {
      novelty: 0,
      feasibility: 0,
      count: 0
    },
    groupB: {
      novelty: 0,
      feasibility: 0,
      count: 0
    }
  });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Fetch all submissions
        const submissionsQuery = query(collection(db, 'submissions'));
        const submissionsSnap = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Submission[];

        // Fetch all reviews
        const reviewsQuery = query(collection(db, 'reviews'));
        const reviewsSnap = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];

        // Calculate scores for each submission
        const submissionStats = submissionsData.map(submission => {
          const relevantReviews = reviewsData.filter(review => 
            review.submissionAId === submission.id || 
            review.submissionBId === submission.id
          );

          const noveltyWins = relevantReviews.filter(review => {
            const isA = review.submissionAId === submission.id;
            return (isA && review.moreNovel === 'A') || (!isA && review.moreNovel === 'B');
          }).length;

          const feasibilityWins = relevantReviews.filter(review => {
            const isA = review.submissionAId === submission.id;
            return (isA && review.moreFeasible === 'A') || (!isA && review.moreFeasible === 'B');
          }).length;

          return {
            id: submission.id,
            content: submission.content,
            group: submission.group,
            noveltyScore: relevantReviews.length > 0 ? noveltyWins / relevantReviews.length : 0,
            feasibilityScore: relevantReviews.length > 0 ? feasibilityWins / relevantReviews.length : 0,
            totalReviews: relevantReviews.length
          };
        });

        // Calculate aggregate stats
        const stats = submissionStats.reduce((acc, submission) => {
          const group = submission.group.toLowerCase() as 'a' | 'b';
          return {
            ...acc,
            [`group${submission.group}`]: {
              novelty: acc[`group${submission.group}`].novelty + submission.noveltyScore,
              feasibility: acc[`group${submission.group}`].feasibility + submission.feasibilityScore,
              count: acc[`group${submission.group}`].count + 1
            }
          };
        }, {
          groupA: { novelty: 0, feasibility: 0, count: 0 },
          groupB: { novelty: 0, feasibility: 0, count: 0 }
        });

        // Average the scores
        if (stats.groupA.count > 0) {
          stats.groupA.novelty /= stats.groupA.count;
          stats.groupA.feasibility /= stats.groupA.count;
        }
        if (stats.groupB.count > 0) {
          stats.groupB.novelty /= stats.groupB.count;
          stats.groupB.feasibility /= stats.groupB.count;
        }

        setSubmissions(submissionStats);
        setAggregateStats(stats);
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return <div>Loading results...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Results</h2>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-4">Group A Averages</h3>
          <div className="space-y-2">
            <p>Novelty: {(aggregateStats.groupA.novelty * 100).toFixed(1)}%</p>
            <p>Feasibility: {(aggregateStats.groupA.feasibility * 100).toFixed(1)}%</p>
            <p>Total Submissions: {aggregateStats.groupA.count}</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold mb-4">Group B Averages</h3>
          <div className="space-y-2">
            <p>Novelty: {(aggregateStats.groupB.novelty * 100).toFixed(1)}%</p>
            <p>Feasibility: {(aggregateStats.groupB.feasibility * 100).toFixed(1)}%</p>
            <p>Total Submissions: {aggregateStats.groupB.count}</p>
          </div>
        </div>
      </div>

      {/* Individual Submissions */}
      <div>
        <h3 className="font-semibold mb-4">Individual Submissions</h3>
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="border p-4 rounded">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Group {submission.group}</span>
                <span className="text-sm text-gray-600">
                  {submission.totalReviews} reviews
                </span>
              </div>
              <div className="mb-2 text-sm">
                <span className="mr-4">
                  Novelty: {(submission.noveltyScore * 100).toFixed(1)}%
                </span>
                <span>
                  Feasibility: {(submission.feasibilityScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="whitespace-pre-wrap text-gray-700">
                {submission.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Results Button */}
      <button
        onClick={() => {
          const data = {
            aggregateStats,
            submissions: submissions.map(s => ({
              ...s,
              content: s.content.slice(0, 100) + '...' // Truncate content for CSV
            }))
          };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'experiment-results.json';
          a.click();
          URL.revokeObjectURL(url);
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Export Results
      </button>
    </div>
  );
}