import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, CheckCircle, XCircle, Bell, BellOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import SlotTracker from './SlotTracker';
import { requestNotificationPermission, scheduleSlotNotification } from '../../lib/notifications';

interface ScheduleSlot {
  id: string;
  subject: string;
  topic: string;
  start_time: string;
  end_time: string;
  completed: boolean;
  notes?: string;
  understanding_rating?: number;
  completed_topics?: string[];
}

interface Schedule {
  id: string;
  week_starting: string;
  slots: ScheduleSlot[];
}

export default function ScheduleView() {
  const { user } = useAuth();
  const [schedule, setSchedule] = React.useState<Schedule | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<ScheduleSlot | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  React.useEffect(() => {
    async function checkNotifications() {
      const enabled = await requestNotificationPermission();
      setNotificationsEnabled(enabled);
    }
    checkNotifications();
  }, []);

  React.useEffect(() => {
    async function fetchSchedule() {
      try {
        const { data, error } = await supabase
          .from('study_schedules')
          .select('*')
          .eq('user_id', user?.id)
          .order('week_starting', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setSchedule(data);

        // Schedule notifications for upcoming slots
        if (notificationsEnabled && data?.slots) {
          data.slots
            .filter(slot => !slot.completed)
            .forEach(slot => scheduleSlotNotification(slot));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchSchedule();
    }
  }, [user, notificationsEnabled]);

  const toggleSlotCompletion = async (slot: ScheduleSlot) => {
    if (!schedule) return;

    if (!slot.completed) {
      setSelectedSlot(slot);
      return;
    }

    try {
      const { error } = await supabase
        .from('study_slots')
        .update({ completed: false })
        .eq('id', slot.id);

      if (error) throw error;

      const newSchedule = {
        ...schedule,
        slots: schedule.slots.map(s =>
          s.id === slot.id ? { ...s, completed: false } : s
        ),
      };
      setSchedule(newSchedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slot');
    }
  };

  const handleSlotComplete = async () => {
    if (!schedule || !selectedSlot) return;

    const newSchedule = {
      ...schedule,
      slots: schedule.slots.map(s =>
        s.id === selectedSlot.id ? { ...s, completed: true } : s
      ),
    };
    setSchedule(newSchedule);
    setSelectedSlot(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading schedule...</div>
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

  if (!schedule) {
    return (
      <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
        No schedule found. Generate a new schedule to get started.
      </div>
    );
  }

  const groupedSlots = schedule.slots.reduce((acc, slot) => {
    const day = slot.start_time.split(' ')[0];
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(slot);
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Study Schedule</h2>
          <p className="text-gray-600">
            Week starting {format(parseISO(schedule.week_starting), 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => requestNotificationPermission()}
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            {notificationsEnabled ? (
              <>
                <Bell className="w-4 h-4" />
                <span>Notifications enabled</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                <span>Enable notifications</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-600">Upcoming</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {Object.entries(groupedSlots).map(([day, slots]) => (
          <div key={day} className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              {day}
            </h3>
            <div className="space-y-4">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    slot.completed ? 'bg-green-50' : 'bg-white border border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleSlotCompletion(slot)}
                    className="focus:outline-none"
                  >
                    {slot.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{slot.subject}</h4>
                    <p className="text-sm text-gray-600">{slot.topic}</p>
                    {slot.completed && slot.understanding_rating && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Understanding: {slot.understanding_rating}/5
                        </span>
                        {slot.completed_topics && slot.completed_topics.length > 0 && (
                          <span className="text-xs text-gray-500">
                            • {slot.completed_topics.length} topics completed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>
                      {slot.start_time.split(' ')[1]} - {slot.end_time.split(' ')[1]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedSlot && (
        <SlotTracker
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onComplete={handleSlotComplete}
        />
      )}
    </div>
  );
}