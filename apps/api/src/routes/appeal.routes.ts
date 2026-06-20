import { Router } from 'express';
import { appealController } from '../controllers/appeal.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

router.use(authenticate);

// POST /api/v1/appeals — body: { submissionId, justification }
router.post('/', (req, res, next) => appealController.create(req, res, next));

// GET /api/v1/appeals — current user's appeals (populated with submission)
router.get('/', (req, res, next) => appealController.list(req, res, next));

// GET /api/v1/appeals/queue — admin: all pending appeals  ← MUST be before /:id
router.get('/queue', adminOnly, (req, res, next) => appealController.queue(req, res, next));

// PATCH /api/v1/appeals/:id/review — admin: { decision, adminResponse? }
router.patch('/:id/review', adminOnly, (req, res, next) =>
  appealController.review(req, res, next),
);

export default router;
