import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export const client = new OpenAI({ apiKey });

export const DEFAULT_MODEL = 'gpt-4o-mini';

export function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    // Handle both {{key}} (double-brace) and {KEY} (single-brace) variants
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Generate a JSON response from OpenAI.
 * Appends schemaDescription to systemPrompt to instruct the model to output JSON.
 */
export async function generateJson(params: {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  schemaDescription: string;
}): Promise<string> {
  const model = params.model ?? DEFAULT_MODEL;
  const systemWithSchema = `${params.systemPrompt}\n\n${params.schemaDescription}`;
  const t0 = Date.now();
  console.log(`[openai] generateJson model=${model}`);

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemWithSchema },
        { role: 'user', content: params.userPrompt },
      ],
    });
    const content = response.choices[0]?.message?.content ?? '{}';
    console.log(`[openai] generateJson done in ${Date.now() - t0}ms tokens=${response.usage?.total_tokens ?? '?'}`);
    return content;
  } catch (err) {
    console.error(`[openai] generateJson error after ${Date.now() - t0}ms:`, err);
    throw err;
  }
}

/**
 * Generate a plain text response from OpenAI.
 */
export async function generateText(params: {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const model = params.model ?? DEFAULT_MODEL;
  const t0 = Date.now();
  console.log(`[openai] generateText model=${model}`);

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
    });
    const content = response.choices[0]?.message?.content ?? '';
    console.log(`[openai] generateText done in ${Date.now() - t0}ms tokens=${response.usage?.total_tokens ?? '?'}`);
    return content;
  } catch (err) {
    console.error(`[openai] generateText error after ${Date.now() - t0}ms:`, err);
    throw err;
  }
}
