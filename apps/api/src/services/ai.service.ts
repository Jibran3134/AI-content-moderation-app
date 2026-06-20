import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface AIAnalysis {
  decision: 'approved' | 'flagged' | 'blocked' | 'needs_review';
  confidence: number; // 0–100
  categoryResults: Array<{
    category: string;
    detected: boolean;
    confidence: number;
    reasoning: string;
  }>;
  reasoning: string;
}

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    if (!env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return openaiClient;
}

const CATEGORIES = [
  'graphic_violence',
  'hate_symbols',
  'self_harm',
  'extremist_propaganda',
  'weapons_contraband',
  'harassment_humiliation',
];

const SYSTEM_PROMPT = `You are an expert image content moderation AI. Analyze the provided image URL and return a JSON response:
{
  "decision": "approved" | "flagged" | "blocked",
  "confidence": 0-100,
  "categoryResults": [
    { "category": "<one of the 6 categories>", "detected": true|false, "confidence": 0-100, "reasoning": "..." }
  ],
  "reasoning": "Overall explanation"
}

Categories: ${CATEGORIES.join(', ')}.
Return a categoryResults entry for every category.
Be precise — blocked for clear violations, flagged for uncertain cases, approved if safe.`;

export class AIService {
  async analyzeImage(imageUrl: string): Promise<AIAnalysis> {
    const client = getClient();

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image for content policy violations:' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1024,
        temperature: 0.1,
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(raw) as AIAnalysis;
    } catch (error) {
      logger.error('OpenAI image analysis failed:', error);
      return {
        decision: 'needs_review',
        confidence: 0,
        categoryResults: CATEGORIES.map((c) => ({
          category: c,
          detected: false,
          confidence: 0,
          reasoning: 'AI analysis unavailable — manual review required',
        })),
        reasoning: 'AI analysis failed — requires manual review',
      };
    }
  }

  /** Fallback: analyse a URL string as text */
  async analyzeText(text: string): Promise<AIAnalysis> {
    return this.analyzeImage(text);
  }
}

export const aiService = new AIService();
