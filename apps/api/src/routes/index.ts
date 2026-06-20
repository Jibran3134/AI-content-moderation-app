import { Router } from 'express';
import authRoutes from './auth.routes';
import submissionRoutes from './submission.routes';
import verdictRoutes from './verdict.routes';
import appealRoutes from './appeal.routes';
import policyRoutes from './policy.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/submissions', submissionRoutes);
router.use('/verdicts', verdictRoutes);
router.use('/appeals', appealRoutes);
router.use('/policies', policyRoutes);
router.use('/analytics', analyticsRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Moderation Platform API v1',
    timestamp: new Date().toISOString(),
  });
});

export default router;
