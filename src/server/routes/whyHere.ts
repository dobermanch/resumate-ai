import { Hono } from 'hono';
import { generateJson, replacePlaceholders } from '../utils/openai.js';
import { WHY_HERE_SCHEMA } from '../utils/schemas.js';
import type { WhyHereRequest, WhyHereResponse } from '../types.js';

export const whyHereRoute = new Hono();

whyHereRoute.post('/why-here', async (c) => {
  const body = await c.req.json<WhyHereRequest>();

  if (!body.resumeText?.trim() || !body.jobText?.trim()) {
    return c.json({ error: 'resumeText and jobText are required' }, 400);
  }
  if (!body.systemPrompt?.trim() || !body.userPromptTemplate?.trim()) {
    return c.json({ error: 'systemPrompt and userPromptTemplate are required' }, 400);
  }

  const userPrompt = replacePlaceholders(body.userPromptTemplate, {
    resumeText: body.resumeText,
    jobText: body.jobText,
    companyText: body.companyText ?? '',
  });

  try {
    const rawJson = await generateJson({
      model: body.model,
      systemPrompt: body.systemPrompt,
      userPrompt,
      schemaDescription: WHY_HERE_SCHEMA,
    });
    const parsed = JSON.parse(rawJson);
    const whyHere = Array.isArray(parsed.whyHere) ? parsed.whyHere : [];

    return c.json({ whyHere } satisfies WhyHereResponse);
  } catch (error) {
    console.error('[why-here] Error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
