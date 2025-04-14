import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp, Clock, Award } from 'lucide-react';

interface PerformanceMetrics {
  testScores: {
    date: string;
    score: number;
    total: number;
  }[];
  subjectPerformance: {
    subject: string;
    averageScore: number;
    testsAttempted: number;
  }[];
  weakTopics: {
    subject: string;
    topic: string;
    averageScore: number;
  }[];
  studyProgress: {
    completed: number;
    total: number;
    lastWeekHours: number;
  };
}

export default function PerformanceDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [user]);

  const fetchPerformanceMetrics = async () => {
    try {
      // Fetch test scores
      const { data: testData, error: testError } = await supabase
        .from('mock_tests')
        .select('date, total_score, questions')
        .eq('user_id', user?.id)
        .eq('completed', true)
        .order('date', { ascending: true });

      if (testError) throw testError;

      // Fetch study progress
      const { data: studyData, error: studyError } = await supabase
        .from('study_slots')
        .select('*')
        .eq('user_id', user?.id);

      if (studyError) throw studyError;

      // Process and transform the data
      const testScores = testData.map(test => ({
        date: new Date(test.date).toLocaleDateString(),
        score: test.total_score,
        total: test.questions.length * 5 // Assuming max score per question is 5
      }));

      // Calculate subject performance
      const subjectPerformance = calculateSubjectPerformance(testData);
      
      // Identify weak topics
      const weakTopics = identifyWeakTopics(testData);

      // Calculate study progress
      const studyProgress = calculateStudyProgress(studyData);

      setMetrics({
        testScores,
        subjectPerformance,
        weakTopics,
        studyProgress
      });
    } catch (err) {
      setError('Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubjectPerformance = (testData: any[]) => {
    const subjects: Record<string, { total: number; count: number }> = {};
    
    testData.forEach(test => {
      test.questions.forEach((q: any) => {
        if (!subjects[q.subject]) {
          subjects[q.subject] = { total: 0, count: 0 };
        }
        subjects[q.subject].total += q.score || 0;
        subjects[q.subject].count += 1;
      });
    });

    return Object.entries(subjects).map(([subject, data]) => ({
      subject,
      averageScore: data.total / data.count,
      testsAttempted: data.count
    }));
  };

  const identifyWeakTopics = (testData: any[]) => {
    const topicScores: Record<string, { total: number; count: number; subject: string }> = {};
    
    testData.forEach(test => {
      test.questions.forEach((q: any) => {
        const key = `${q.subject}-${q.topic}`;
        if (!topicScores[key]) {
          topicScores[key] = { total: 0, count: 0, subject: q.subject };
        }
        topicScores[key].total += q.score || 0;
        topicScores[key].count += 1;
      });
    });

    return Object.entries(topicScores)
      .map(([key, data]) => {
        const [, topic] = key.split('-');
        return {
          subject: data.subject,
          topic,
          averageScore: data.total / data.count
        };
      })
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5);
  };

  const calculateStudyProgress = (studyData: any[]) => {
    const completed = studyData.filter(slot => slot.completed).length;
    const total = studyData.length;
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastWeekHours = studyData
      .filter(slot => new Date(slot.completed_at) > lastWeek && slot.completed)
      .reduce((acc, slot) => {
        const duration = new Date(slot.end_time).getTime() - new Date(slot.start_time).getTime();
        return acc + (duration / (1000 * 60 * 60));
      }, 0);

    return {
      completed,
      total,
      lastWeekHours
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading performance metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        {error}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Performance Data</h3>
        <p className="text-gray-500 mt-2">Complete some tests to see your performance metrics</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Performance Analysis</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          title="Average Score"
          value={`${Math.round(metrics.testScores.reduce((acc, test) => acc + (test.score / test.total * 100), 0) / metrics.testScores.length)}%`}
          subtitle="Across all tests"
        />
        <StatCard
          icon={<Brain className="w-6 h-6 text-purple-600" />}
          title="Tests Completed"
          value={metrics.testScores.length.toString()}
          subtitle="Total assessments"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-green-600" />}
          title="Study Hours"
          value={Math.round(metrics.studyProgress.lastWeekHours).toString()}
          subtitle="Last 7 days"
        />
        <StatCard
          icon={<Award className="w-6 h-6 text-yellow-600" />}
          title="Completion Rate"
          value={`${Math.round((metrics.studyProgress.completed / metrics.studyProgress.total) * 100)}%`}
          subtitle="Study schedule"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Test Score Progression</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.testScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Subject Performance</h3>
          <div className="space-y-4">
            {metrics.subjectPerformance.map(subject => (
              <div key={subject.subject} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                    <span className="text-sm text-gray-500">{Math.round(subject.averageScore)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-indigo-600 rounded-full"
                      style={{ width: `${subject.averageScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Areas for Improvement</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.weakTopics.map(topic => (
            <div
              key={`${topic.subject}-${topic.topic}`}
              className="border border-gray-200 rounded-lg p-4"
            >
              <h4 className="font-medium text-gray-900">{topic.subject}</h4>
              <p className="text-sm text-gray-600 mt-1">{topic.topic}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-red-500 rounded-full"
                    style={{ width: `${topic.averageScore}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500">
                  {Math.round(topic.averageScore)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}

const StatCard = ({ icon, title, value, subtitle }: StatCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};