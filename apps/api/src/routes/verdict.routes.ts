import { Router } from 'express';
import { verdictController } from '../controllers/verdict.controller';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

router.use(authenticate);

// POST /api/v1/verdicts — admin only
router.post('/', adminOnly, (req, res, next) => verdictController.create(req, res, next));

// GET /api/v1/verdicts/:id
router.get('/:id', (req, res, next) => verdictController.getById(req, res, next));

// GET /api/v1/verdicts/submission/:submissionId
router.get('/submission/:submissionId', (req, res, next) =>
  verdictController.getBySubmission(req, res, next),
);

export default router;
