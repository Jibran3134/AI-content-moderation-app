import { Request, Response, NextFunction } from 'express';
import { Submission } from '../models/Submission';
import { AppError } from '../middleware/error';
import { Types } from 'mongoose';

export class VerdictController {
  /**
   * POST /api/v1/verdicts
   * Manually set a verdict on a submission (admin action).
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { submissionId, outcome, categoryResults } = req.body;
      const submission = await Submission.findById(submissionId);
      if (!submission) throw new AppError(404, 'Submission not found');

      submission.verdict = { outcome, categoryResults: categoryResults ?? [] };
      await submission.save();

      res.status(201).json({ success: true, data: submission });
    } catch (err) {
      next(err);
    }
  }

  async getBySubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await Submission.findOne({
        _id: new Types.ObjectId(req.params.submissionId),
      }).populate('userId', 'name email');
      if (!submission) throw new AppError(404, 'Submission not found');
      if (!submission.verdict) throw new AppError(404, 'No verdict for this submission yet');
      res.status(200).json({ success: true, data: submission.verdict });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await Submission.findById(req.params.id).populate('userId', 'name email');
      if (!submission) throw new AppError(404, 'Submission not found');
      if (!submission.verdict) throw new AppError(404, 'No verdict for this submission yet');
      res.status(200).json({ success: true, data: submission.verdict });
    } catch (err) {
      next(err);
    }
  }
}

export const verdictController = new VerdictController();
