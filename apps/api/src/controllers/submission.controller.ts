import { Request, Response, NextFunction } from 'express';
import { submissionService } from '../services/submission.service';

export class SubmissionController {
  /** POST / — process 1-10 image files */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        res.status(400).json({ success: false, message: 'No images uploaded' });
        return;
      }

      const results = await submissionService.processImages(req.user!.sub, files);
      res.status(201).json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  }

  /** GET / — current user's submissions with optional ?outcome= ?page= ?limit= */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const outcome = req.query.outcome as string | undefined;

      const result = await submissionService.getUserSubmissions(
        req.user!.sub,
        req.user!.role,
        page,
        limit,
        outcome,
      );
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /** GET /:id */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const submission = await submissionService.getById(
        req.params.id,
        req.user!.sub,
        req.user!.role,
      );
      res.status(200).json({ success: true, data: submission });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await submissionService.delete(req.params.id, req.user!.sub, req.user!.role);
      res.status(200).json({ success: true, message: 'Submission deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const submissionController = new SubmissionController();
