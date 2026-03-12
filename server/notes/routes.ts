import express, { type Request, type Response } from 'express';
import z from 'zod';

import { asyncHandler } from '../asyncHandler';
import { requireAuth } from '../auth/middleware';
import { ValidationError } from '../errors';
import { applicationsRateLimiter } from '../rateLimit';
import {
  createNote,
  deleteNote,
  getNoteById,
  listNotes,
  updateNote,
} from './service';
import {
  createNoteBodySchema,
  listNotesQuerySchema,
  updateNoteBodySchema,
} from './types';

const uuidParamSchema = z.string().uuid();

const router = express.Router();

router.use(asyncHandler(requireAuth));
router.use(applicationsRateLimiter());

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const queryResult = listNotesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => e.message).join('; ')
      );
    }
    const result = await listNotes(user.id, queryResult.data);
    res.json(result);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError('Invalid note id');
    }
    const note = await getNoteById(user.id, idResult.data);
    res.json(note);
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const bodyResult = createNoteBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join('; ')
      );
    }
    const note = await createNote(user.id, bodyResult.data);
    res.status(201).json(note);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError('Invalid note id');
    }
    const bodyResult = updateNoteBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join('; ')
      );
    }
    const note = await updateNote(user.id, idResult.data, bodyResult.data);
    res.json(note);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError('Invalid note id');
    }
    await deleteNote(user.id, idResult.data);
    res.status(204).send();
  })
);

export default router;
