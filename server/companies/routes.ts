import express, { type Request, type Response } from "express";
import z from "zod";

import { asyncHandler } from "../asyncHandler";
import { requireAuth } from "../auth/middleware";
import { ValidationError } from "../errors";
import { companiesRateLimiter } from "../rateLimit";
import {
  createCompany,
  deleteCompany,
  getCompanyById,
  listCompanies,
  updateCompany,
} from "./service";
import {
  createCompanyBodySchema,
  listCompaniesQuerySchema,
  updateCompanyBodySchema,
} from "./types";

const uuidParamSchema = z.string().uuid();

const router = express.Router();

router.use(asyncHandler(requireAuth));
router.use(companiesRateLimiter());

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const queryResult = listCompaniesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const { page, limit, q } = queryResult.data;
    const { items, total } = await listCompanies(user.id, page, limit, q);
    res.json({ items, page, limit, total });
  }),
);

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const bodyResult = createCompanyBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const company = await createCompany(user.id, bodyResult.data);
    res.status(201).json(company);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError("Invalid company id");
    }
    const company = await getCompanyById(user.id, idResult.data);
    res.json(company);
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError("Invalid company id");
    }
    const bodyResult = updateCompanyBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const company = await updateCompany(
      user.id,
      idResult.data,
      bodyResult.data,
    );
    res.json(company);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) {
      throw new ValidationError("Invalid company id");
    }
    await deleteCompany(user.id, idResult.data);
    res.status(204).send();
  }),
);

export default router;
