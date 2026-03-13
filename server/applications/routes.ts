import express, { type Request, type Response } from "express";
import z from "zod";

import { asyncHandler } from "../asyncHandler";
import { requireAuth } from "../auth/middleware";
import { ValidationError } from "../errors";
import { applicationsRateLimiter } from "../rateLimit";
import {
  createInterview,
  listInterviewsByApplicationId,
} from "../interviews/service";
import { createInterviewBodySchema } from "../interviews/types";
import {
  createApplication,
  deleteApplication,
  getApplicationById,
  listApplications,
  updateApplication,
} from "./service";
import {
  createApplicationBodySchema,
  listApplicationsQuerySchema,
  updateApplicationBodySchema,
} from "./types";

const uuidParamSchema = z.string().uuid();

const router = express.Router();

router.use(asyncHandler(requireAuth));
router.use(applicationsRateLimiter());

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const queryResult = listApplicationsQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const { page, limit } = queryResult.data;
    const { items, total } = await listApplications(user.id, page, limit);
    res.json({ items, page, limit, total });
  }),
);

router.get(
  "/:applicationId/interviews",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const applicationIdResult = uuidParamSchema.safeParse(
      req.params.applicationId,
    );
    if (!applicationIdResult.success) {
      throw new ValidationError("Invalid application id");
    }
    await getApplicationById(user.id, applicationIdResult.data);
    const items = await listInterviewsByApplicationId(
      user.id,
      applicationIdResult.data,
    );
    res.json({ items });
  }),
);

router.post(
  "/:applicationId/interviews",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const applicationIdResult = uuidParamSchema.safeParse(
      req.params.applicationId,
    );
    if (!applicationIdResult.success) {
      throw new ValidationError("Invalid application id");
    }
    await getApplicationById(user.id, applicationIdResult.data);
    const bodyResult = createInterviewBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const interview = await createInterview(
      user.id,
      applicationIdResult.data,
      bodyResult.data,
    );
    res.status(201).json(interview);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError("Invalid application id");
    }
    const application = await getApplicationById(user.id, idResult.data);
    res.json(application);
  }),
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const bodyResult = createApplicationBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const application = await createApplication(user.id, bodyResult.data);
    res.status(201).json(application);
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError("Invalid application id");
    }
    const bodyResult = updateApplicationBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const application = await updateApplication(
      user.id,
      idResult.data,
      bodyResult.data,
    );
    res.json(application);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError("Invalid application id");
    }
    await deleteApplication(user.id, idResult.data);
    res.status(204).send();
  }),
);

export default router;
