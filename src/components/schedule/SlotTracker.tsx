import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookOpen, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const trackingSchema = z.object({
  notes: z.string().min(1, 'Please add some notes about what you studied'),
  understanding: z.number().min(1).max(5, 'Rate your understanding from 1-5'),
  completed_topics: z.array(z.string()).min(1, 'Select at least one completed topic'),
});

type TrackingData = z.infer<typeof trackingSchema>;

interface SlotTrackerProps {
  slot: {
    id: string;
    subject: string;
    topic: string;
    start_time: string;
    end_time: string;
  };
  onClose: () => void;
  onComplete: () => void;
}

export default function SlotTracker({ slot, onClose, onComplete }: SlotTrackerProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrackingData>({
    resolver: zodResolver(trackingSchema),
    defaultValues: {
      notes: '',
      understanding: 3,
      completed_topics: [],
    },
  });

  const onSubmit = async (data: TrackingData) => {
    try {
      const { error } = await supabase
        .from('study_slots')
        .update({
          notes: data.notes,
          understanding_rating: data.understanding,
          completed_topics: data.completed_topics,
          completed: true,
        })
        .eq('id', slot.id);

      if (error) throw error;
      onComplete();
    } catch (err) {
      console.error('Failed to save tracking data:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{slot.subject}</h3>
              <p className="text-sm text-gray-600">{slot.topic}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Study Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="What did you learn? Any difficult concepts?"
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Understanding Rating
            </label>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label key={rating} className="flex items-center gap-2">
                  <input
                    type="radio"
                    {...register('understanding')}
                    value={rating}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{rating}</span>
                </label>
              ))}
            </div>
            {errors.understanding && (
              <p className="mt-1 text-sm text-red-600">
                {errors.understanding.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completed Topics
            </label>
            <div className="space-y-2">
              {slot.topic.split(',').map((topic, index) => (
                <label key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('completed_topics')}
                    value={topic.trim()}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{topic.trim()}</span>
                </label>
              ))}
            </div>
            {errors.completed_topics && (
              <p className="mt-1 text-sm text-red-600">
                {errors.completed_topics.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}