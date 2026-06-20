import { Router } from 'express';
import multer from 'multer';
import { submissionController } from '../controllers/submission.controller';
import { authenticate } from '../middleware/auth';

// ─── Memory storage (buffer available for AI + disk write in service) ─────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 5 * 1024 * 1024,   // 5 MB per file
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'));
    }
  },
});

const router = Router();

// All routes require auth
router.use(authenticate);

// POST /api/v1/submissions — accept 1-10 images in field `images`
router.post(
  '/',
  upload.array('images', 10),
  (req, res, next) => submissionController.create(req, res, next),
);

// GET /api/v1/submissions?outcome=&page=&limit=
router.get('/', (req, res, next) => submissionController.list(req, res, next));

// GET /api/v1/submissions/:id
router.get('/:id', (req, res, next) => submissionController.getById(req, res, next));

// DELETE /api/v1/submissions/:id
router.delete('/:id', (req, res, next) => submissionController.delete(req, res, next));

export default router;
