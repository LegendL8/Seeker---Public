import express, { type Request, type Response } from "express";

import { asyncHandler } from "../asyncHandler";
import { requireAuth } from "../auth/middleware";
import { ValidationError } from "../errors";
import { userSettingsWriteRateLimiter } from "../rateLimit";
import {
  deleteCurrentUserAccount,
  getUserPreferences,
  updateCurrentUserDisplayName,
  updateUserPreferences,
} from "./service";
import {
  updateCurrentUserBodySchema,
  updatePreferencesBodySchema,
} from "./types";

const router = express.Router();

router.use(asyncHandler(requireAuth));

router.get(
  "/me",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      subscriptionTier: user.subscriptionTier,
    });
  }),
);

router.patch(
  "/me",
  userSettingsWriteRateLimiter(),
  asyncHandler(async (req: Request, res: Response) => {
    const bodyResult = updateCurrentUserBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const user = req.user!;
    const nextDisplayName = bodyResult.data.displayName;
    const updated = await updateCurrentUserDisplayName(
      user.id,
      nextDisplayName,
    );
    res.json({
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      subscriptionTier: updated.subscriptionTier,
    });
  }),
);

router.delete(
  "/me",
  userSettingsWriteRateLimiter(),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    await deleteCurrentUserAccount(user.id);
    res.status(204).send();
  }),
);

router.get(
  "/me/preferences",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const data = await getUserPreferences(user.id);
    res.json({ data });
  }),
);

router.patch(
  "/me/preferences",
  userSettingsWriteRateLimiter(),
  asyncHandler(async (req: Request, res: Response) => {
    const bodyResult = updatePreferencesBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const user = req.user!;
    const data = await updateUserPreferences(
      user.id,
      bodyResult.data.postingCheckFrequency,
    );
    res.json({ data });
  }),
);

export default router;
