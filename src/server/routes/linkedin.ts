import { Hono } from 'hono';
import { generateJson, replacePlaceholders } from '../utils/openai.js';
import { LINKEDIN_RESUME_SCHEMA } from '../utils/schemas.js';
import type { LinkedinRequest, LinkedinResponse } from '../types.js';

export const linkedinRoute = new Hono();

linkedinRoute.post('/linkedin-details', async (c) => {
  const body = await c.req.json<LinkedinRequest>();

  if (!body.resumeText?.trim()) {
    return c.json({ error: 'resumeText are required' }, 400);
  }
  if (!body.systemPrompt?.trim() || !body.userPromptTemplate?.trim()) {
    return c.json({ error: 'systemPrompt and userPromptTemplate are required' }, 400);
  }

  const userPrompt = replacePlaceholders(body.userPromptTemplate, {
    resumeText: body.resumeText,
  });

  try {
    const raw = await generateJson({
      model: body.model,
      systemPrompt: body.systemPrompt,
      userPrompt,
      schemaDescription: LINKEDIN_RESUME_SCHEMA,
    });

    const result = JSON.parse(raw) as LinkedinResponse;
    return c.json(result);
  } catch (error) {
    console.error('[linkedin-details] Error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
