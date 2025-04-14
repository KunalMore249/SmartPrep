import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface TestConfig {
  userId: string;
  subjects: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  questionTypes: ('mcq' | 'descriptive')[];
}

interface Question {
  question: string;
  type: 'mcq' | 'descriptive';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  subject: string;
  marks: number;
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

    const config: TestConfig = await req.json();

    // Generate questions using Gemini
    const questions = await generateQuestions(config);

    // Store test in database
    const { data, error } = await supabase
      .from('mock_tests')
      .insert([
        {
          user_id: config.userId,
          date: new Date().toISOString(),
          questions,
          answers: [],
          total_score: questions.reduce((sum, q) => sum + q.marks, 0),
          completed: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ test: data }),
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

async function generateQuestions(config: TestConfig): Promise<Question[]> {
  const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const questionsPerSubject = Math.ceil(
    (config.duration / config.subjects.length) / 5
  );

  const prompt = `
    Generate ${questionsPerSubject} ${config.difficulty} level questions for each of these subjects: ${config.subjects.join(', ')}.
    
    For each subject, include:
    - ${config.questionTypes.includes('mcq') ? 'Multiple choice questions with 4 options' : ''}
    - ${config.questionTypes.includes('descriptive') ? 'Descriptive questions' : ''}
    
    Each question should have:
    - Clear, concise wording
    - For MCQs: 4 plausible options
    - Correct answer
    - Brief explanation
    - Marks (2-5 based on difficulty)
    
    Return in this JSON format:
    {
      "questions": [
        {
          "question": "question text",
          "type": "mcq" or "descriptive",
          "options": ["A", "B", "C", "D"] (for MCQs),
          "correct_answer": "answer",
          "explanation": "why this is correct",
          "subject": "subject name",
          "marks": number
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
      throw new Error('Invalid question format returned from Gemini');
    }
    
    const generated = JSON.parse(match[0]);
    return generated.questions;
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to basic question generation
    return generateBasicQuestions(config);
  }
}

function generateBasicQuestions(config: TestConfig): Question[] {
  const questions: Question[] = [];
  const questionsPerSubject = Math.ceil(
    (config.duration / config.subjects.length) / 5
  );

  for (const subject of config.subjects) {
    for (let i = 0; i < questionsPerSubject; i++) {
      if (config.questionTypes.includes('mcq')) {
        questions.push({
          question: `Sample ${subject} MCQ question ${i + 1}`,
          type: 'mcq',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: 'Option A',
          explanation: 'This is a sample explanation',
          subject,
          marks: 2,
        });
      }
      if (config.questionTypes.includes('descriptive')) {
        questions.push({
          question: `Sample ${subject} descriptive question ${i + 1}`,
          type: 'descriptive',
          correct_answer: 'Sample answer',
          explanation: 'This is a sample explanation',
          subject,
          marks: 5,
        });
      }
    }
  }

  return questions;
}