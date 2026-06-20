import { Submission } from '../models/Submission';
import { AppError } from '../middleware/error';
import { Types } from 'mongoose';
import type { VerdictOutcome, ICategoryResult } from '../models/Submission';

export class VerdictService {
  async createVerdict(
    submissionId: string,
    outcome: VerdictOutcome,
    categoryResults: ICategoryResult[],
  ) {
    const submission = await Submission.findById(submissionId);
    if (!submission) throw new AppError(404, 'Submission not found');

    submission.verdict = { outcome, categoryResults };
    await submission.save();
    return submission;
  }

  async getVerdictBySubmission(submissionId: string) {
    const submission = await Submission.findOne({
      _id: new Types.ObjectId(submissionId),
    });
    if (!submission) throw new AppError(404, 'Submission not found');
    if (!submission.verdict) throw new AppError(404, 'No verdict for this submission yet');
    return submission.verdict;
  }

  async listSubmissionsWithVerdicts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Submission.find({ verdict: { $exists: true } })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Submission.countDocuments({ verdict: { $exists: true } }),
    ]);
    return { data, total, page, pages: Math.ceil(total / limit) };
  }
}

export const verdictService = new VerdictService();
