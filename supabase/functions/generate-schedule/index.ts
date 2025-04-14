import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { format, parse, addDays } from 'npm:date-fns@3.3.1';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ScheduleInput {
  userId: string;
  weekStarting: string;
  subjects: Array<{
    name: string;
    topics: string[];
    priority: number;
  }>;
  availableHours: Array<{
    day: string;
    slots: Array<{
      start: string;
      end: string;
    }>;
  }>;
}

interface ScheduleSlot {
  subject: string;
  topic: string;
  start_time: string;
  end_time: string;
  completed: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { userId, weekStarting, subjects, availableHours }: ScheduleInput = await req.json();

    // Generate optimized schedule using Gemini
    const schedule = await generateOptimizedSchedule(subjects, availableHours);

    // Store in database
    const { data, error } = await supabase
      .from('study_schedules')
      .insert([
        {
          user_id: userId,
          week_starting: weekStarting,
          slots: schedule,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ schedule: data }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function generateOptimizedSchedule(
  subjects: ScheduleInput['subjects'],
  availableHours: ScheduleInput['availableHours']
): Promise<ScheduleSlot[]> {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    As an AI study schedule optimizer, create an optimal weekly study schedule based on the following inputs:

    Subjects and Topics:
    ${subjects.map(s => `
      ${s.name} (Priority: ${s.priority})
      Topics: ${s.topics.join(', ')}
    `).join('\n')}

    Available Time Slots:
    ${availableHours.map(day => `
      ${day.day}:
      ${day.slots.map(slot => `${slot.start}-${slot.end}`).join(', ')}
    `).join('\n')}

    Please create a schedule that:
    1. Prioritizes higher priority subjects
    2. Ensures topics are spread out for better retention
    3. Alternates between subjects to maintain focus
    4. Considers topic complexity when allocating time
    5. Includes short breaks between sessions

    Return the schedule in the following JSON format:
    {
      "schedule": [
        {
          "subject": "subject name",
          "topic": "specific topic",
          "start_time": "day time",
          "end_time": "day time"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('Invalid schedule format returned from Gemini');
    }
    
    const generatedSchedule = JSON.parse(match[0]);
    
    // Transform and validate the schedule
    return generatedSchedule.schedule.map((slot: any) => ({
      ...slot,
      completed: false,
    }));
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to basic scheduling if Gemini fails
    return generateBasicSchedule(subjects, availableHours);
  }
}

function generateBasicSchedule(
  subjects: ScheduleInput['subjects'],
  availableHours: ScheduleInput['availableHours']
): ScheduleSlot[] {
  const schedule: ScheduleSlot[] = [];
  const sortedSubjects = [...subjects].sort((a, b) => b.priority - a.priority);
  
  for (const daySlots of availableHours) {
    const day = daySlots.day;
    for (const slot of daySlots.slots) {
      const subject = sortedSubjects[Math.floor(Math.random() * sortedSubjects.length)];
      const topic = subject.topics[Math.floor(Math.random() * subject.topics.length)];
      
      schedule.push({
        subject: subject.name,
        topic,
        start_time: `${day} ${slot.start}`,
        end_time: `${day} ${slot.end}`,
        completed: false,
      });
    }
  }
  
  return schedule;
}