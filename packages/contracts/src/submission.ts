import { z } from 'zod';

// ─── Content Type Enum ────────────────────────────────────────────────────────

export const ContentTypeEnum = z.enum(['text', 'image', 'video', 'audio', 'url']);
export type ContentType = z.infer<typeof ContentTypeEnum>;

// ─── Submission Status Enum ───────────────────────────────────────────────────

export const SubmissionStatusEnum = z.enum([
  'pending',
  'processing',
  'approved',
  'rejected',
  'appealed',
  'escalated',
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusEnum>;

// ─── Create Submission ────────────────────────────────────────────────────────

export const CreateSubmissionSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
  contentType: ContentTypeEnum,
  content: z
    .string()
    .min(1, 'Content is required')
    .max(10000, 'Content must be at most 10,000 characters')
    .optional(), // text content (for text type)
  sourceUrl: z.string().url('Invalid URL').optional(), // for url type
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional().default([]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
});

export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>;

// ─── List Submissions (query params) ─────────────────────────────────────────

export const ListSubmissionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: SubmissionStatusEnum.optional(),
  contentType: ContentTypeEnum.optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type ListSubmissionsQuery = z.infer<typeof ListSubmissionsQuerySchema>;

// ─── Submission Response ──────────────────────────────────────────────────────

export interface SubmissionResponse {
  id: string;
  title: string;
  description?: string;
  contentType: ContentType;
  content?: string;
  sourceUrl?: string;
  fileUrl?: string;
  tags: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: SubmissionStatus;
  submittedBy: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSubmissions {
  data: SubmissionResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
