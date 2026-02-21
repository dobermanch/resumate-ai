/**
 * JSON schema descriptions appended to system prompts for OpenAI JSON mode.
 * OpenAI's json_object mode requires the model to be explicitly told to output JSON.
 */

export const MATCH_ANALYSIS_SCHEMA = `
Respond with a JSON object matching exactly this structure:
{
  "analysis": {
    "strengths": [<string: areas where resume already aligns well>],
    "score": <number 0-100 representing match percentage>,
    "gaps": [<string: missing qualification or skill>],
    "improvements": [<string: specific improvement suggestion>]
  }
}`;

export const TAILORED_RESUME_SCHEMA = `
Respond with a JSON object matching exactly this structure:
{
  "tailoredResume": <string: the complete rewritten resume text>
}`;

export const INTERVIEW_PREP_SCHEMA = `
Respond with a JSON object matching exactly this structure:
{
  "questions": [
    {
      "question": <string: the interview question>,
      "answer": <string: a model answer with framework guidance>
    }
  ]
}`;

export const LINKEDIN_RESUME_SCHEMA = `
Respond with a JSON object matching exactly this structure:
{
  "linkedin": {
    "headline": <string: linkedIn profile headline>,
    "summary": <string: linkedIn profile summary>,
    "openToWork": <string: an ppen to work announcement post>
  }
}`;