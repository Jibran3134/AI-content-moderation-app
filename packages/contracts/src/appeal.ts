import { z } from 'zod';

// ─── Appeal Status ────────────────────────────────────────────────────────────

export const AppealStatusEnum = z.enum([
  'pending',
  'under_review',
  'upheld',    // original verdict stands
  'overturned', // original verdict reversed
  'withdrawn',
]);
export type AppealStatus = z.infer<typeof AppealStatusEnum>;

// ─── Create Appeal ────────────────────────────────────────────────────────────

export const CreateAppealSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  reason: z
    .string()
    .min(20, 'Please provide at least 20 characters explaining your appeal')
    .max(5000, 'Appeal reason must be at most 5000 characters'),
  supportingEvidence: z
    .string()
    .max(5000, 'Supporting evidence must be at most 5000 characters')
    .optional(),
  contactEmail: z.string().email('Invalid contact email').optional(),
});

export type CreateAppealInput = z.infer<typeof CreateAppealSchema>;

// ─── Review Appeal (moderator action) ────────────────────────────────────────

export const ReviewAppealSchema = z.object({
  decision: z.enum(['upheld', 'overturned']),
  notes: z
    .string()
    .min(10, 'Please provide at least 10 characters of reasoning')
    .max(5000, 'Notes must be at most 5000 characters'),
});

export type ReviewAppealInput = z.infer<typeof ReviewAppealSchema>;

// ─── Appeal Response ──────────────────────────────────────────────────────────

export interface AppealResponse {
  id: string;
  submissionId: string;
  reason: string;
  supportingEvidence?: string;
  contactEmail?: string;
  status: AppealStatus;
  reviewNotes?: string;
  submittedBy: { id: string; name: string };
  reviewedBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
