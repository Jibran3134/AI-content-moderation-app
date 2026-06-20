import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

export class AnalyticsController {
  async overview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.overview();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async submissionsOverTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = Math.min(Number(req.query.period ?? 7), 90);
      const data = await analyticsService.submissionsOverTime(period);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async categoryBreakdown(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.categoryBreakdown();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async appealsSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.appealsSummary();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async userRankings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.userRankings();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
