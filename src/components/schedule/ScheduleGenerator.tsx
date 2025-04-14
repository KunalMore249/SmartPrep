import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Minus, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  topics: z.array(z.string()).min(1, 'At least one topic is required'),
  priority: z.number().min(1).max(5),
});

const timeSlotSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const dayScheduleSchema = z.object({
  day: z.string(),
  slots: z.array(timeSlotSchema),
});

const scheduleFormSchema = z.object({
  weekStarting: z.string(),
  subjects: z.array(subjectSchema),
  availableHours: z.array(dayScheduleSchema),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function ScheduleGenerator() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      subjects: [{ name: '', topics: [''], priority: 3 }],
      availableHours: DAYS_OF_WEEK.map(day => ({
        day,
        slots: [{ start: '09:00', end: '10:00' }],
      })),
    },
  });

  const onSubmit = async (data: ScheduleFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-schedule`,
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
        throw new Error('Failed to generate schedule');
      }

      setSuccess(true);
      // You can add navigation logic here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addSubject = () => {
    const subjects = watch('subjects');
    setValue('subjects', [...subjects, { name: '', topics: [''], priority: 3 }]);
  };

  const removeSubject = (index: number) => {
    const subjects = watch('subjects');
    if (subjects.length > 1) {
      setValue('subjects', subjects.filter((_, i) => i !== index));
    }
  };

  const addTopic = (subjectIndex: number) => {
    const subjects = watch('subjects');
    const newSubjects = [...subjects];
    newSubjects[subjectIndex].topics.push('');
    setValue('subjects', newSubjects);
  };

  const removeTopic = (subjectIndex: number, topicIndex: number) => {
    const subjects = watch('subjects');
    const newSubjects = [...subjects];
    if (newSubjects[subjectIndex].topics.length > 1) {
      newSubjects[subjectIndex].topics = newSubjects[subjectIndex].topics.filter(
        (_, i) => i !== topicIndex
      );
      setValue('subjects', newSubjects);
    }
  };

  const addTimeSlot = (dayIndex: number) => {
    const availableHours = watch('availableHours');
    const newAvailableHours = [...availableHours];
    newAvailableHours[dayIndex].slots.push({ start: '09:00', end: '10:00' });
    setValue('availableHours', newAvailableHours);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const availableHours = watch('availableHours');
    const newAvailableHours = [...availableHours];
    if (newAvailableHours[dayIndex].slots.length > 1) {
      newAvailableHours[dayIndex].slots = newAvailableHours[dayIndex].slots.filter(
        (_, i) => i !== slotIndex
      );
      setValue('availableHours', newAvailableHours);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Study Schedule</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-md">
            Schedule generated successfully!
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Week Starting
          </label>
          <input
            type="date"
            {...register('weekStarting')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {errors.weekStarting && (
            <p className="mt-1 text-sm text-red-600">{errors.weekStarting.message}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Subjects</h3>
            <button
              type="button"
              onClick={addSubject}
              className="text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {watch('subjects').map((subject, subjectIndex) => (
            <div key={subjectIndex} className="border border-gray-200 rounded-md p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      {...register(`subjects.${subjectIndex}.name`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {errors.subjects?.[subjectIndex]?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.subjects[subjectIndex].name?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      {...register(`subjects.${subjectIndex}.priority`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {errors.subjects?.[subjectIndex]?.priority && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.subjects[subjectIndex].priority?.message}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSubject(subjectIndex)}
                  className="ml-4 text-red-600 hover:text-red-700"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Topics
                  </label>
                  <button
                    type="button"
                    onClick={() => addTopic(subjectIndex)}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {subject.topics.map((_, topicIndex) => (
                  <div key={topicIndex} className="flex gap-2">
                    <input
                      type="text"
                      {...register(`subjects.${subjectIndex}.topics.${topicIndex}`)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter topic"
                    />
                    <button
                      type="button"
                      onClick={() => removeTopic(subjectIndex, topicIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {errors.subjects?.[subjectIndex]?.topics && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.subjects[subjectIndex].topics?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Available Hours</h3>
          {watch('availableHours').map((day, dayIndex) => (
            <div key={day.day} className="border border-gray-200 rounded-md p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-medium text-gray-700">{day.day}</h4>
                <button
                  type="button"
                  onClick={() => addTimeSlot(dayIndex)}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {day.slots.map((_, slotIndex) => (
                  <div key={slotIndex} className="flex gap-4 items-center">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="time"
                          {...register(`availableHours.${dayIndex}.slots.${slotIndex}.start`)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          {...register(`availableHours.${dayIndex}.slots.${slotIndex}.end`)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Generating Schedule...
              </>
            ) : (
              'Generate Schedule'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}