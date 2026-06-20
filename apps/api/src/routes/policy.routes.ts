import { Router } from 'express';
import { policyController } from '../controllers/policy.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// GET /api/v1/policies
router.get('/', authenticate, (req, res, next) => policyController.list(req, res, next));

// GET /api/v1/policies/:category
router.get('/:category', authenticate, (req, res, next) =>
  policyController.getByCategory(req, res, next),
);

// PATCH /api/v1/policies/:category  (admin only)
router.patch('/:category', authenticate, adminOnly, (req, res, next) =>
  policyController.update(req, res, next),
);

export default router;
