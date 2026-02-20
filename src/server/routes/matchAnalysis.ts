import { Hono } from 'hono';
import { generateJson, replacePlaceholders } from '../lib/openai.js';
import { MATCH_ANALYSIS_SCHEMA } from '../lib/schemas.js';
import type { MatchAnalysisRequest, MatchAnalysisResponse } from '../types.js';

export const matchAnalysisRoute = new Hono();

matchAnalysisRoute.post('/match-analysis', async (c) => {
  const body = await c.req.json<MatchAnalysisRequest>();

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
      schemaDescription: MATCH_ANALYSIS_SCHEMA,
    });

    const result = JSON.parse(raw) as MatchAnalysisResponse;
    return c.json(result);
  }
  catch(error){
    return c.json({ error: error }, 400);
  }
});
