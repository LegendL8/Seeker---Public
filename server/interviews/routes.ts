import express, { type Request, type Response } from 'express';
import z from 'zod';

import { asyncHandler } from '../asyncHandler';
import { requireAuth } from '../auth/middleware';
import { ValidationError } from '../errors';
import { applicationsRateLimiter } from '../rateLimit';
import {
  deleteInterview,
  getInterviewById,
  updateInterview,
} from './service';
import { updateInterviewBodySchema } from './types';

const uuidParamSchema = z.string().uuid();

const router = express.Router();

router.use(asyncHandler(requireAuth));
router.use(applicationsRateLimiter());

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError('Invalid interview id');
    }
    const interview = await getInterviewById(user.id, idResult.data);
    res.json(interview);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError('Invalid interview id');
    }
    const bodyResult = updateInterviewBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join('; ')
      );
    }
    const interview = await updateInterview(
      user.id,
      idResult.data,
      bodyResult.data
    );
    res.json(interview);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError('Invalid interview id');
    }
    await deleteInterview(user.id, idResult.data);
    res.status(204).send();
  })
);

export default router;
