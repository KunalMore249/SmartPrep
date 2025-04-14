import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Brain, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

const testConfigSchema = z.object({
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  duration: z.number().min(30).max(180),
  questionTypes: z.array(z.enum(['mcq', 'descriptive'])).min(1),
});

type TestConfig = z.infer<typeof testConfigSchema>;

export default function MockTestGenerator() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TestConfig>({
    resolver: zodResolver(testConfigSchema),
    defaultValues: {
      subjects: [],
      difficulty: 'medium',
      duration: 60,
      questionTypes: ['mcq'],
    },
  });

  const onSubmit = async (data: TestConfig) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            ...data,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate test');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Brain className="w-8 h-8 text-indigo-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Generate Mock Test</h2>
          <p className="text-gray-600">Create a personalized practice test</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-md">
            Test generated successfully! Head to the Tests section to begin.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subjects
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Mathematics', 'Physics', 'Chemistry', 'Biology'].map((subject) => (
              <label key={subject} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={subject}
                  {...register('subjects')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>{subject}</span>
              </label>
            ))}
          </div>
          {errors.subjects && (
            <p className="mt-1 text-sm text-red-600">{errors.subjects.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            {...register('difficulty')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {errors.difficulty && (
            <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            {...register('duration', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            min="30"
            max="180"
          />
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Types
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                value="mcq"
                {...register('questionTypes')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Multiple Choice</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                value="descriptive"
                {...register('questionTypes')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Descriptive</span>
            </label>
          </div>
          {errors.questionTypes && (
            <p className="mt-1 text-sm text-red-600">{errors.questionTypes.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating Test...
            </>
          ) : (
            'Generate Test'
          )}
        </button>
      </form>
    </div>
  );
}