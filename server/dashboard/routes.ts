import express, { type Request, type Response } from 'express';

import { asyncHandler } from '../asyncHandler';
import { requireAuth } from '../auth/middleware';
import { applicationsRateLimiter } from '../rateLimit';
import { getMetrics } from './service';

const router = express.Router();

router.use(asyncHandler(requireAuth));
router.use(applicationsRateLimiter());

router.get(
  '/metrics',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const metrics = await getMetrics(userId);
    res.json({ data: metrics });
  })
);

export default router;
