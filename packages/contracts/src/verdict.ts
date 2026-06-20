import { z } from 'zod';

// ─── Verdict Decision Enum ────────────────────────────────────────────────────

export const VerdictDecisionEnum = z.enum([
  'approved',
  'rejected',
  'needs_review',
  'escalated',
]);
export type VerdictDecision = z.infer<typeof VerdictDecisionEnum>;

// ─── AI Category ─────────────────────────────────────────────────────────────

export const AICategoryEnum = z.enum([
  'hate_speech',
  'violence',
  'sexual_content',
  'spam',
  'misinformation',
  'harassment',
  'self_harm',
  'safe',
  'other',
]);
export type AICategory = z.infer<typeof AICategoryEnum>;

// ─── AI Analysis Result ───────────────────────────────────────────────────────

export const AIAnalysisSchema = z.object({
  decision: VerdictDecisionEnum,
  confidence: z.number().min(0).max(1),
  categories: z.array(
    z.object({
      name: AICategoryEnum,
      score: z.number().min(0).max(1),
    }),
  ),
  reasoning: z.string(),
  flaggedSegments: z
    .array(
      z.object({
        text: z.string(),
        category: AICategoryEnum,
        severity: z.enum(['low', 'medium', 'high']),
      }),
    )
    .optional()
    .default([]),
  processingTimeMs: z.number().optional(),
});

export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;

// ─── Create Verdict (human moderator) ────────────────────────────────────────

export const CreateVerdictSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  decision: VerdictDecisionEnum,
  notes: z
    .string()
    .min(10, 'Please provide at least 10 characters of reasoning')
    .max(5000, 'Notes must be at most 5000 characters'),
  overridesAI: z.boolean().optional().default(false),
  overrideReason: z.string().max(2000).optional(),
});

export type CreateVerdictInput = z.infer<typeof CreateVerdictSchema>;

// ─── Verdict Response ─────────────────────────────────────────────────────────

export interface VerdictResponse {
  id: string;
  submissionId: string;
  decision: VerdictDecision;
  notes: string;
  overridesAI: boolean;
  overrideReason?: string;
  aiAnalysis?: AIAnalysis;
  reviewedBy: { id: string; name: string };
  createdAt: string;
}
