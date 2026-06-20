import { z } from 'zod';

// ─── Policy Rule ──────────────────────────────────────────────────────────────

export const PolicyRuleSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  action: z.enum(['auto_reject', 'flag_review', 'auto_approve', 'escalate']),
  threshold: z
    .number()
    .min(0, 'Threshold must be between 0 and 1')
    .max(1, 'Threshold must be between 0 and 1'),
  enabled: z.boolean().default(true),
  description: z.string().max(500).optional(),
});

export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

// ─── Create Policy ────────────────────────────────────────────────────────────

export const CreatePolicySchema = z.object({
  name: z
    .string()
    .min(3, 'Policy name must be at least 3 characters')
    .max(200, 'Policy name must be at most 200 characters')
    .trim(),
  description: z.string().max(2000).optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g. 1.0.0)'),
  rules: z.array(PolicyRuleSchema).min(1, 'At least one rule is required').max(50),
  isActive: z.boolean().optional().default(false),
  contentTypes: z
    .array(z.enum(['text', 'image', 'video', 'audio', 'url']))
    .min(1, 'At least one content type is required'),
});

export type CreatePolicyInput = z.infer<typeof CreatePolicySchema>;

// ─── Update Policy ────────────────────────────────────────────────────────────

export const UpdatePolicySchema = CreatePolicySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdatePolicyInput = z.infer<typeof UpdatePolicySchema>;

// ─── Policy Response ──────────────────────────────────────────────────────────

export interface PolicyResponse {
  id: string;
  name: string;
  description?: string;
  version: string;
  rules: PolicyRule[];
  isActive: boolean;
  contentTypes: string[];
  createdBy: { id: string; name: string };
  updatedBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
