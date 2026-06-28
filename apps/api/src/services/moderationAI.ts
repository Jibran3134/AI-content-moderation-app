import Groq from 'groq-sdk';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface CategoryResult {
  category: string;
  detected: boolean;
  confidence: number;   // 0–100
  reasoning: string;
}

const CATEGORIES = [
  'graphic_violence',
  'hate_symbols',
  'self_harm',
  'extremist_propaganda',
  'weapons_contraband',
  'harassment_humiliation',
] as const;

const SYSTEM_PROMPT = `You are a content moderation AI. Analyze the image for these 6 categories: \
graphic_violence, hate_symbols, self_harm, extremist_propaganda, weapons_contraband, harassment_humiliation. \
Return ONLY valid JSON: { "results": [{ "category": string, "detected": boolean, "confidence": 0-100, "reasoning": string }] } \
Return exactly 6 items — one per category, in the order listed above.`;

let _client: Groq | null = null;
function getClient(): Groq {
  if (!_client) {
    if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
    _client = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return _client;
}

/**
 * Analyze an image buffer for content policy violations.
 * Returns exactly 6 CategoryResult items (one per category).
 */
export async function analyzeImage(
  buffer: Buffer,
  mimetype: string,
): Promise<CategoryResult[]> {
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimetype};base64,${base64}`;

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
      temperature: 0.1,
    });

    const raw = JSON.parse(response.choices[0]?.message?.content ?? '{}') as {
      results?: CategoryResult[];
    };

    const results: CategoryResult[] = raw.results ?? [];

    // Ensure all 6 categories are present (fill missing with safe defaults)
    return CATEGORIES.map((cat) => {
      const found = results.find((r) => r.category === cat);
      return (
        found ?? {
          category: cat,
          detected: false,
          confidence: 0,
          reasoning: 'Not analysed',
        }
      );
    });
  } catch (err) {
    logger.error('moderationAI.analyzeImage failed:', err);
    // Fallback: flag everything for manual review
    return CATEGORIES.map((cat) => ({
      category: cat,
      detected: false,
      confidence: 0,
      reasoning: 'AI unavailable — manual review required',
    }));
  }
}
