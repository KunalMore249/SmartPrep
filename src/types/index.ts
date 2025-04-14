export interface User {
  id: string;
  email: string;
  full_name: string;
  guardian_email?: string;
}

export interface StudySlot {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  subject: string;
  topics: string[];
  completed: boolean;
  notes?: string;
}

export interface MockTest {
  id: string;
  user_id: string;
  date: string;
  questions: {
    question: string;
    options?: string[];
    type: 'mcq' | 'descriptive';
    correct_answer?: string;
    user_answer?: string;
    score?: number;
  }[];
  total_score: number;
  completed: boolean;
}

export interface StudySchedule {
  id: string;
  user_id: string;
  week_starting: string;
  slots: StudySlot[];
}