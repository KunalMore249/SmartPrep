import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { Brain, Calendar, Clock, AlertTriangle } from 'lucide-react';

interface RevisionTopic {
  subject: string;
  topic: string;
  lastStudied: string;
  performance: number;
  nextRevision: string;
  priority: number;
}

export default function RevisionScheduler() {
  const { user } = useAuth();
  const [revisionTopics, setRevisionTopics] = useState<RevisionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevisionData();
  }, [user]);

  const fetchRevisionData = async () => {
    try {
      // Fetch test results
      const { data: testData, error: testError } = await supabase
        .from('mock_tests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('completed', true);

      if (testError) throw testError;

      // Fetch study slots
      const { data: studyData, error: studyError } = await supabase
        .from('study_slots')
        .select('*')
        .eq('user_id', user?.id);

      if (studyError) throw studyError;

      // Process data to generate revision schedule
      const topics = generateRevisionSchedule(testData, studyData);
      setRevisionTopics(topics);
    } catch (err) {
      setError('Failed to load revision data');
    } finally {
      setLoading(false);
    }
  };

  const generateRevisionSchedule = (testData: any[], studyData: any[]): RevisionTopic[] => {
    const topicPerformance: Record<string, {
      performance: number;
      lastStudied: string;
      count: number;
    }> = {};

    // Analyze test performance
    testData.forEach(test => {
      test.questions.forEach((q: any) => {
        const key = `${q.subject}-${q.topic}`;
        if (!topicPerformance[key]) {
          topicPerformance[key] = {
            performance: 0,
            lastStudied: '',
            count: 0
          };
        }
        topicPerformance[key].performance += q.score || 0;
        topicPerformance[key].count += 1;
      });
    });

    // Update last studied dates
    studyData.forEach(slot => {
      const key = `${slot.subject}-${slot.topic}`;
      if (topicPerformance[key]) {
        const slotDate = new Date(slot.end_time);
        const currentLastStudied = topicPerformance[key].lastStudied;
        if (!currentLastStudied || slotDate > new Date(currentLastStudied)) {
          topicPerformance[key].lastStudied = slot.end_time;
        }
      }
    });

    // Calculate revision schedule
    return Object.entries(topicPerformance).map(([key, data]) => {
      const [subject, topic] = key.split('-');
      const averagePerformance = data.performance / data.count;
      
      // Calculate next revision date based on performance
      const lastStudied = new Date(data.lastStudied);
      const daysToAdd = calculateRevisionInterval(averagePerformance);
      const nextRevision = new Date(lastStudied);
      nextRevision.setDate(nextRevision.getDate() + daysToAdd);

      return {
        subject,
        topic,
        lastStudied: data.lastStudied,
        performance: averagePerformance,
        nextRevision: nextRevision.toISOString(),
        priority: calculatePriority(averagePerformance, lastStudied)
      };
    }).sort((a, b) => b.priority - a.priority);
  };

  const calculateRevisionInterval = (performance: number): number => {
    // Implement spaced repetition algorithm
    if (performance < 60) return 1; // Review next day
    if (performance < 75) return 3; // Review in 3 days
    if (performance < 90) return 7; // Review in a week
    return 14; // Review in two weeks
  };

  const calculatePriority = (performance: number, lastStudied: Date): number => {
    const daysSinceStudied = Math.floor((Date.now() - lastStudied.getTime()) / (1000 * 60 * 60 * 24));
    return (100 - performance) * (1 + daysSinceStudied / 7);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading revision schedule...</div>
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

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revision Schedule</h2>
          <p className="text-gray-600">Optimized based on your performance</p>
        </div>
        <button
          onClick={() => fetchRevisionData()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Refresh Schedule
        </button>
      </div>

      <div className="space-y-6">
        {revisionTopics.map((topic, index) => (
          <div
            key={`${topic.subject}-${topic.topic}`}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  topic.performance < 70 ? 'bg-red-100' :
                  topic.performance < 85 ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}>
                  <Brain className={`w-6 h-6 ${
                    topic.performance < 70 ? 'text-red-600' :
                    topic.performance < 85 ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{topic.subject}</h3>
                    <p className="text-gray-600">{topic.topic}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      Performance: {Math.round(topic.performance)}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Priority Score: {Math.round(topic.priority)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Last studied: {new Date(topic.lastStudied).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Next revision: {new Date(topic.nextRevision).toLocaleDateString()}</span>
                  </div>
                </div>
                {new Date(topic.nextRevision) <= new Date() && (
                  <div className="mt-4 flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Revision overdue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}