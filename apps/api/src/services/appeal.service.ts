import { Appeal } from '../models/Appeal';
import { Submission } from '../models/Submission';
import { AppError } from '../middleware/error';
import { Types } from 'mongoose';

export class AppealService {
  /** POST / — user creates an appeal for their flagged/blocked submission */
  async create(submissionId: string, justification: string, userId: string) {
    const submission = await Submission.findById(submissionId);
    if (!submission) throw new AppError(404, 'Submission not found');

    // Validate ownership
    if (submission.userId.toString() !== userId) {
      throw new AppError(403, 'You can only appeal your own submissions');
    }

    // Only flagged or blocked can be appealed
    const outcome = submission.verdict?.outcome;
    if (!outcome || outcome === 'approved') {
      throw new AppError(400, 'Only flagged or blocked submissions can be appealed');
    }

    // unique constraint on submissionId handles duplicate appeals
    const appeal = await Appeal.create({
      submissionId: new Types.ObjectId(submissionId),
      userId: new Types.ObjectId(userId),
      justification,
      status: 'pending',
    });

    // Link appeal back to submission
    await Submission.findByIdAndUpdate(submissionId, { appealId: appeal._id });

    return appeal;
  }

  /** GET / — current user's own appeals, populated with submission */
  async getUserAppeals(userId: string, page: number, limit: number) {
    const filter = { userId: new Types.ObjectId(userId) };
    const [data, total] = await Promise.all([
      Appeal.find(filter)
        .populate('submissionId', 'imageUrl verdict')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Appeal.countDocuments(filter),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /** GET /queue — admin: all pending appeals */
  async getQueue(page: number, limit: number) {
    const filter = { status: 'pending' };
    const [data, total] = await Promise.all([
      Appeal.find(filter)
        .populate('userId', 'name email')
        .populate('submissionId', 'imageUrl verdict')
        .sort({ createdAt: 1 })    // oldest first — FIFO review queue
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Appeal.countDocuments(filter),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  /** PATCH /:id/review — admin reviews an appeal */
  async review(
    appealId: string,
    reviewerId: string,
    decision: 'accepted' | 'rejected',
    adminResponse?: string,
  ) {
    const appeal = await Appeal.findById(appealId);
    if (!appeal) throw new AppError(404, 'Appeal not found');

    if (appeal.status !== 'pending') {
      throw new AppError(400, 'This appeal has already been resolved');
    }

    appeal.status = decision;
    appeal.adminResponse = adminResponse;
    appeal.reviewedBy = new Types.ObjectId(reviewerId);
    appeal.reviewedAt = new Date();
    await appeal.save();

    // If accepted: restore submission outcome to approved
    if (decision === 'accepted') {
      await Submission.findByIdAndUpdate(appeal.submissionId, {
        'verdict.outcome': 'approved',
      });
    }

    return appeal;
  }
}

export const appealService = new AppealService();
