import { Hono } from 'hono';
import { generateText, replacePlaceholders } from '../lib/openai.js';
import type { CoverLetterRequest, CoverLetterResponse } from '../types.js';

export const coverLetterRoute = new Hono();

coverLetterRoute.post('/cover-letter', async (c) => {
  const body = await c.req.json<CoverLetterRequest>();

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

  const coverLetter = await generateText({
    model: body.model,
    systemPrompt: body.systemPrompt,
    userPrompt,
  });

  return c.json({ coverLetter } satisfies CoverLetterResponse);
});
