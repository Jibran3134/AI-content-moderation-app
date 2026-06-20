import { Request, Response, NextFunction } from 'express';
import { Policy } from '../models/Policy';
import { AppError } from '../middleware/error';

export class PolicyController {
  /** GET /policies — list all 6 category policies */
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await Policy.find().sort({ category: 1 }).lean();
      res.status(200).json({ success: true, data: policies });
    } catch (err) {
      next(err);
    }
  }

  /** GET /policies/:category — get one policy by category slug */
  async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policy = await Policy.findOne({ category: req.params.category });
      if (!policy) throw new AppError(404, 'Policy not found');
      res.status(200).json({ success: true, data: policy });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /policies/:category — update enabled, confidenceThreshold, enforcement */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { enabled, confidenceThreshold, enforcement } = req.body;
      const policy = await Policy.findOneAndUpdate(
        { category: req.params.category },
        { enabled, confidenceThreshold, enforcement },
        { new: true, runValidators: true },
      );
      if (!policy) throw new AppError(404, 'Policy not found');
      res.status(200).json({ success: true, data: policy });
    } catch (err) {
      next(err);
    }
  }
}

export const policyController = new PolicyController();
