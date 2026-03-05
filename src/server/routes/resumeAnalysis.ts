import { Hono } from 'hono';
import { generateJson, replacePlaceholders } from '../utils/openai.js';
import { RESUME_ANALYSIS_SCHEMA } from '../utils/schemas.js';
import type { ResumeAnalysisRequest, ResumeAnalysisResponse } from '../types.js';

export const resumeAnalysisRoute = new Hono();

resumeAnalysisRoute.post('/resume-analysis', async (c) => {
  const body = await c.req.json<ResumeAnalysisRequest>();

  if (!body.resumeText?.trim()) {
    return c.json({ error: 'resumeText is required' }, 400);
  }
  if (!body.systemPrompt?.trim() || !body.userPromptTemplate?.trim()) {
    return c.json({ error: 'systemPrompt and userPromptTemplate are required' }, 400);
  }

  const userPrompt = replacePlaceholders(body.userPromptTemplate, {
    resumeText: body.resumeText,
  });

  try {
    const rawJson = await generateJson({
      model: body.model,
      systemPrompt: body.systemPrompt,
      userPrompt,
      schemaDescription: RESUME_ANALYSIS_SCHEMA,
    });
    const parsed = JSON.parse(rawJson);

    const analysis = {
      overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 0,
      structureAnalysis: typeof parsed.structureAnalysis === 'string' ? parsed.structureAnalysis : '',
      impactAnalysis: typeof parsed.impactAnalysis === 'string' ? parsed.impactAnalysis : '',
      languageAnalysis: typeof parsed.languageAnalysis === 'string' ? parsed.languageAnalysis : '',
      atsScan: typeof parsed.atsScan === 'string' ? parsed.atsScan : '',
      skillsIdentified: {
        hardSkills: Array.isArray(parsed.skillsIdentified?.hardSkills) ? parsed.skillsIdentified.hardSkills : [],
        softSkills: Array.isArray(parsed.skillsIdentified?.softSkills) ? parsed.skillsIdentified.softSkills : [],
        tools: Array.isArray(parsed.skillsIdentified?.tools) ? parsed.skillsIdentified.tools : [],
        domainKeywords: Array.isArray(parsed.skillsIdentified?.domainKeywords) ? parsed.skillsIdentified.domainKeywords : [],
      },
      bestFitJobTypes: Array.isArray(parsed.bestFitJobTypes) ? parsed.bestFitJobTypes : [],
      keyImprovements: Array.isArray(parsed.keyImprovements) ? parsed.keyImprovements : [],
    };

    return c.json({ analysis } satisfies ResumeAnalysisResponse);
  } catch (error) {
    console.error('[resume-analysis] Error:', error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
