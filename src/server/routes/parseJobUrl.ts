import { Hono } from 'hono';
import { generateJson, replacePlaceholders } from '../utils/openai.js';
import { JOB_PARSING_SCHEMA } from '../utils/schemas.js';
import type { ParseJobUrlRequest, ParseJobUrlResponse } from '../types.js';

export const parseJobUrlRoute = new Hono();

parseJobUrlRoute.post('/parse-job-url', async (c) => {
  const body = await c.req.json<ParseJobUrlRequest>();

  if (!body.url?.trim()) {
    return c.json({ error: 'url is required' }, 400);
  }
  if (!body.systemPrompt?.trim() || !body.userPromptTemplate?.trim()) {
    return c.json({ error: 'systemPrompt and userPromptTemplate are required' }, 400);
  }

  // Fetch the page content from the URL
  let pageContent: string;
  try {
    const response = await fetch(body.url);
    if (!response.ok) {
      console.error(`[parse-job-url] Fetch failed: ${response.status} ${response.statusText}`);
      return c.json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }, 400);
    }
    pageContent = await response.text();
  } catch (err) {
    console.error('[parse-job-url] Fetch error:', err);
    return c.json({ error: `Failed to fetch URL: ${err instanceof Error ? err.message : String(err)}` }, 400);
  }

  // jobParsing_user_prompt.md uses {HTML_CONTENT} (single brace) — pass both variants
  const userPrompt = replacePlaceholders(body.userPromptTemplate, {
    pageContent: pageContent,
    input: pageContent,
  });

  try {
    const rawJson = await generateJson({
      model: body.model,
      systemPrompt: body.systemPrompt,
      userPrompt,
      schemaDescription: JOB_PARSING_SCHEMA,
    });
    const parsed = JSON.parse(rawJson);
    const toText = (val: unknown): string => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object')
        return Object.entries(val as Record<string, unknown>)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}:\n${v}`)
          .join('\n\n');
      return String(val ?? '');
    };
    const jobText = toText(parsed.jobDetails);
    const companyDetails = toText(parsed.companyDetails);

    return c.json({ jobText, companyDetails } satisfies ParseJobUrlResponse);
  } catch (error) {
    console.error('[parse-job-url] Error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
