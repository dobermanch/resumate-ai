import { Hono } from 'hono';
import { generateText, replacePlaceholders } from '../utils/openai.js';
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
      return c.json({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }, 400);
    }
    pageContent = await response.text();
  } catch (err) {
    return c.json({ error: `Failed to fetch URL: ${err instanceof Error ? err.message : String(err)}` }, 400);
  }

  // jobParsing_user_prompt.md uses {HTML_CONTENT} (single brace) — pass both variants
  const userPrompt = replacePlaceholders(body.userPromptTemplate, {
    HTML_CONTENT: pageContent,
    input: pageContent,
  });

  const jobText = await generateText({
    model: body.model,
    systemPrompt: body.systemPrompt,
    userPrompt,
  });

  return c.json({ jobText } satisfies ParseJobUrlResponse);
});
