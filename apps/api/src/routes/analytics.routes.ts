import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// All analytics endpoints require admin
router.use(authenticate, adminOnly);

// GET /api/v1/analytics/overview
router.get('/overview', (req, res, next) => analyticsController.overview(req, res, next));

// GET /api/v1/analytics/submissions-over-time?period=7|30|90
router.get('/submissions-over-time', (req, res, next) =>
  analyticsController.submissionsOverTime(req, res, next),
);

// GET /api/v1/analytics/category-breakdown
router.get('/category-breakdown', (req, res, next) =>
  analyticsController.categoryBreakdown(req, res, next),
);

// GET /api/v1/analytics/appeals-summary
router.get('/appeals-summary', (req, res, next) =>
  analyticsController.appealsSummary(req, res, next),
);

// GET /api/v1/analytics/user-rankings
router.get('/user-rankings', (req, res, next) =>
  analyticsController.userRankings(req, res, next),
);

export default router;
