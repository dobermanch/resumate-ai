import 'dotenv/config';
import { execSync } from 'child_process';
import { readFile } from 'node:fs/promises';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { matchAnalysisRoute } from './routes/matchAnalysis.js';
import { tailoredResumeRoute } from './routes/tailoredResume.js';
import { coverLetterRoute } from './routes/coverLetter.js';
import { interviewPrepRoute } from './routes/interviewPrep.js';
import { parseJobUrlRoute } from './routes/parseJobUrl.js';
import { linkedinRoute } from './routes/linkedin.js';
import { tunnelRoute } from './routes/tunnel.js';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return null;
    if (/^https?:\/\/[a-zA-Z0-9-]+\.lhr\.life$/.test(origin)) return origin;
    if (['http://localhost:3000', 'http://localhost:4000'].includes(origin)) return origin;
    return null;
  },
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api', matchAnalysisRoute);
app.route('/api', tailoredResumeRoute);
app.route('/api', coverLetterRoute);
app.route('/api', interviewPrepRoute);
app.route('/api', parseJobUrlRoute);
app.route('/api', linkedinRoute);
app.route('/api', tunnelRoute);

if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './public' }));
  app.notFound(async (c) => {
    const html = await readFile('./public/index.html', 'utf-8');
    return c.html(html);
  });
}

app.onError((err, c) => {
  console.error('[Server Error]', err.message);
  return c.json({ error: err.message ?? 'Internal server error' }, 500);
});

const PORT = Number(process.env.PORT) || 4000;

// Free the port if something is already using it (common during debug restarts)
if (process.env.NODE_ENV !== 'production') {
  try {
    execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  } catch { /* ignore */ }
}

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[Server] Listening on http://localhost:${PORT}`);
});
