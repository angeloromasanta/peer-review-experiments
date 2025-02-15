// Create new file: components/admin/StudentStatusTable.tsx

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, getDocs} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Activity } from '@/types';

interface StudentStatus extends User {
  hasSubmitted: boolean;
  hasReviewed: boolean;
}

interface StudentStatusTableProps {
  activity: Activity | null;
}

export default function StudentStatusTable({ activity }: StudentStatusTableProps) {
  const [students, setStudents] = useState<StudentStatus[]>([]);

  useEffect(() => {
    // Subscribe to users collection
    const q = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(q, async (snapshot) => {
      const studentDocs = snapshot.docs.filter(doc => doc.data().role === 'student');
      
      // Get submissions and reviews
      const submissionsSnap = await getDocs(collection(db, 'submissions'));
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      
      const submissions = new Set(submissionsSnap.docs.map(doc => doc.data().userId));
      const currentRoundReviews = new Set(
        reviewsSnap.docs
          .filter(doc => doc.data().round === activity?.currentRound)
          .map(doc => doc.data().reviewerId)
      );

      const studentData = studentDocs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
        hasSubmitted: submissions.has(doc.id),
        hasReviewed: currentRoundReviews.has(doc.id)
      })) as StudentStatus[];

      setStudents(studentData);
    });

    return () => unsubUsers();
  }, [activity?.currentRound]);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Student Status</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
              {activity?.status === 'submission' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission
                </th>
              )}
              {activity?.status === 'review' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Round {activity.currentRound} Review
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.uid}>
                <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{student.group || 'Not Assigned'}</td>
                {activity?.status === 'submission' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.hasSubmitted ? '✅' : '❌'}
                  </td>
                )}
                {activity?.status === 'review' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.hasReviewed ? '✅' : '❌'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}