import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { Clock, CheckCircle, AlertTriangle, Brain } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'descriptive';
  options?: string[];
  subject: string;
  marks: number;
}

interface Test {
  id: string;
  questions: Question[];
  total_score: number;
  completed: boolean;
  date: string;
}

export default function TestInterface() {
  const { user } = useAuth();
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentTest();
  }, [user]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const fetchCurrentTest = async () => {
    try {
      const { data, error } = await supabase
        .from('mock_tests')
        .select('*')
        .eq('user_id', user?.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentTest(data);
        setTimeLeft(data.duration * 60); // Convert minutes to seconds
      }
    } catch (err) {
      setError('Failed to load test');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitTest = async () => {
    if (!currentTest) return;

    try {
      const { error } = await supabase
        .from('mock_tests')
        .update({
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
            timestamp: new Date().toISOString()
          })),
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', currentTest.id);

      if (error) throw error;
      // Redirect to results page or show completion message
    } catch (err) {
      setError('Failed to submit test');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading test...</div>
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

  if (!currentTest) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Active Tests</h3>
        <p className="text-gray-500 mt-2">Generate a new test to get started</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mock Test</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Time Remaining:
              <span className="ml-2 font-medium text-gray-900">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
            <button
              onClick={submitTest}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Submit Test
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {currentTest.questions.map((question, index) => (
            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-lg text-gray-900 mb-4">{question.question}</p>
                  {question.type === 'mcq' ? (
                    <div className="space-y-3">
                      {question.options?.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) => handleAnswer(question.id, e.target.value)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswer(question.id, e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md p-2"
                      placeholder="Enter your answer..."
                    />
                  )}
                </div>
                <div className="flex-shrink-0 text-sm text-gray-500">
                  {question.marks} marks
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}