import fs from 'fs';
import path from 'path';
import { Submission } from '../models/Submission';
import { Appeal } from '../models/Appeal';
import { Policy } from '../models/Policy';
import { AppError } from '../middleware/error';
import { analyzeImage, CategoryResult } from './moderationAI';
import { Types } from 'mongoose';
import type { IVerdict, VerdictOutcome } from '../models/Submission';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function saveFileToDisk(buffer: Buffer, mimetype: string): string {
  ensureUploadsDir();
  const ext = mimetype.split('/')[1] ?? 'bin';
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return `/uploads/${filename}`;
}

function determineOutcome(
  categoryResults: CategoryResult[],
  policies: Array<{ category: string; enabled: boolean; confidenceThreshold: number; enforcement: string }>,
): VerdictOutcome {
  let outcome: VerdictOutcome = 'approved';

  for (const result of categoryResults) {
    if (!result.detected) continue;

    const policy = policies.find(
      (p) => p.category === result.category && p.enabled,
    );
    if (!policy) continue;

    if (result.confidence >= policy.confidenceThreshold) {
      if (policy.enforcement === 'auto_block') {
        return 'blocked';    // highest priority — short-circuit
      }
      if (policy.enforcement === 'flag_for_review') {
        outcome = 'flagged';
      }
    }
  }

  return outcome;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SubmissionService {
  /**
   * Process 1-10 uploaded image files:
   * save to disk → AI analysis → policy enforcement → save Submission
   */
  async processImages(
    userId: string,
    files: Express.Multer.File[],
  ): Promise<Array<{ submissionId: string; imageUrl: string; verdict: IVerdict }>> {
    const policies = await Policy.find({ enabled: true }).lean();

    const results: Array<{ submissionId: string; imageUrl: string; verdict: IVerdict }> = [];

    for (const file of files) {
      // 1. Save to disk
      const imageUrl = saveFileToDisk(file.buffer, file.mimetype);

      // 2. AI analysis
      const categoryResults = await analyzeImage(file.buffer, file.mimetype);

      // 3. Policy enforcement → outcome
      const outcome = determineOutcome(categoryResults, policies);

      // 4. Persist Submission
      const submission = await Submission.create({
        userId: new Types.ObjectId(userId),
        imageUrl,
        verdict: { outcome, categoryResults },
      });

      results.push({
        submissionId: submission._id.toString(),
        imageUrl,
        verdict: submission.verdict!,
      });
    }

    return results;
  }

  async getUserSubmissions(
    userId: string,
    userRole: string,
    page: number,
    limit: number,
    outcome?: string,
  ) {
    const filter: Record<string, unknown> = {};
    if (userRole !== 'admin') filter.userId = new Types.ObjectId(userId);
    if (outcome) filter['verdict.outcome'] = outcome;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Submission.find(filter)
        .populate('userId', 'name email')
        .populate('appealId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, userId: string, userRole: string) {
    const submission = await Submission.findById(id)
      .populate('userId', 'name email')
      .populate('appealId');

    if (!submission) throw new AppError(404, 'Submission not found');

    if (userRole !== 'admin' && submission.userId.toString() !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return submission;
  }

  async delete(id: string, userId: string, role: string): Promise<void> {
    const submission = await Submission.findById(id);
    if (!submission) throw new AppError(404, 'Submission not found');

    if (role !== 'admin' && submission.userId.toString() !== userId) {
      throw new AppError(403, 'You can only delete your own submissions');
    }

    if (submission.appealId) await Appeal.findByIdAndDelete(submission.appealId);
    await submission.deleteOne();
  }
}

export const submissionService = new SubmissionService();
