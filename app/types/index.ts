// types/index.ts
export type ActivityStatus = 'registration' | 'instructions' | 'submission' | 'review' | 'completed';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  group?: 'A' | 'B';
  submissionId?: string;
}

export interface Activity {
  id: string;
  status: ActivityStatus;
  currentRound: number;
  timestamp: Date;
}

export interface Submission {
  id: string;
  userId: string;
  group: 'A' | 'B';
  content: string;
  timestamp: Date;
}

export interface Review {
  id: string;
  reviewerId: string;
  submissionAId: string;
  submissionBId: string;
  round: number;
  moreNovel: 'A' | 'B';
  moreFeasible: 'A' | 'B';
  timestamp: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
}