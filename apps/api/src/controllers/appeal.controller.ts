import { Request, Response, NextFunction } from 'express';
import { appealService } from '../services/appeal.service';

export class AppealController {
  /** POST / */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { submissionId, justification } = req.body;

      if (!submissionId || !justification) {
        res.status(400).json({ success: false, message: 'submissionId and justification are required' });
        return;
      }

      const appeal = await appealService.create(submissionId, justification, req.user!.sub);
      res.status(201).json({ success: true, data: appeal });
    } catch (err) {
      next(err);
    }
  }

  /** GET / — current user's appeals */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const result = await appealService.getUserAppeals(req.user!.sub, page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /** GET /queue — admin: pending appeals */
  async queue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 20);
      const result = await appealService.getQueue(page, limit);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /:id/review — admin */
  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { decision, adminResponse } = req.body;

      if (!['accepted', 'rejected'].includes(decision)) {
        res.status(400).json({ success: false, message: 'decision must be accepted or rejected' });
        return;
      }

      const appeal = await appealService.review(
        req.params.id,
        req.user!.sub,
        decision,
        adminResponse,
      );
      res.status(200).json({ success: true, data: appeal });
    } catch (err) {
      next(err);
    }
  }
}

export const appealController = new AppealController();
