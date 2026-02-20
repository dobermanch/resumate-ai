import { Hono } from 'hono';
import { generateJson, replacePlaceholders } from '../lib/openai.js';
import { TAILORED_RESUME_SCHEMA } from '../lib/schemas.js';
import type { TailoredResumeRequest, TailoredResumeResponse } from '../types.js';

export const tailoredResumeRoute = new Hono();

tailoredResumeRoute.post('/tailored-resume', async (c) => {
  const body = await c.req.json<TailoredResumeRequest>();

  if (!body.resumeText?.trim() || !body.jobText?.trim()) {
    return c.json({ error: 'resumeText and jobText are required' }, 400);
  }
  if (!body.systemPrompt?.trim() || !body.userPromptTemplate?.trim()) {
    return c.json({ error: 'systemPrompt and userPromptTemplate are required' }, 400);
  }

  const userPrompt = replacePlaceholders(body.userPromptTemplate, {
    resumeText: body.resumeText,
    jobText: body.jobText,
    improvements: body.improvements ?? 'None provided',
  });

  const raw = await generateJson({
    model: body.model,
    systemPrompt: body.systemPrompt,
    userPrompt,
    schemaDescription: TAILORED_RESUME_SCHEMA,
  });

  const result = JSON.parse(raw) as TailoredResumeResponse;
  return c.json(result);
});
