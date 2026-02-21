import { Hono } from 'hono';
import { generateJson, replacePlaceholders } from '../utils/openai.js';
import { INTERVIEW_PREP_SCHEMA } from '../utils/schemas.js';
import type { InterviewPrepRequest, InterviewPrepResponse } from '../types.js';

export const interviewPrepRoute = new Hono();

interviewPrepRoute.post('/interview-prep', async (c) => {
  const body = await c.req.json<InterviewPrepRequest>();

  if (!body.resumeText?.trim() || !body.jobText?.trim()) {
    return c.json({ error: 'resumeText and jobText are required' }, 400);
  }
  if (!body.systemPrompt?.trim() || !body.userPromptTemplate?.trim()) {
    return c.json({ error: 'systemPrompt and userPromptTemplate are required' }, 400);
  }

  const userPrompt = replacePlaceholders(body.userPromptTemplate, {
    resumeText: body.resumeText,
    jobText: body.jobText,
  });

  try {
    const raw = await generateJson({
      model: body.model,
      systemPrompt: body.systemPrompt,
      userPrompt,
      schemaDescription: INTERVIEW_PREP_SCHEMA,
    });

    const parsed = JSON.parse(raw) as { questions?: InterviewPrepResponse['questions'] };
    // Normalise: schema asks for { questions: [...] } but handle bare array just in case
    const rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions ?? []);
    // Coerce fields to strings — the model occasionally returns objects instead of strings,
    // which would cause a React render crash on the client.
    const safeArray: unknown[] = Array.isArray(rawQuestions) ? rawQuestions : [];
    const questions: InterviewPrepResponse['questions'] = safeArray.map((q) => {
      const item = q as Record<string, unknown>;
      return {
        question: typeof item?.question === 'string' ? item.question : JSON.stringify(item?.question ?? ''),
        answer: typeof item?.answer === 'string' ? item.answer : JSON.stringify(item?.answer ?? ''),
      };
    });
    return c.json({ questions } satisfies InterviewPrepResponse);
  } catch (error) {
    console.error('[interview-prep] Error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
