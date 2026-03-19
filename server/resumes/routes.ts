import express, { type Request, type Response } from "express";
import multer from "multer";
import z from "zod";

import { asyncHandler } from "../asyncHandler";
import { requireAuth } from "../auth/middleware";
import { env } from "../config";
import { ValidationError } from "../errors";
import { resumesUploadRateLimiter } from "../rateLimit";
import {
  createResume,
  deleteResume,
  getResumeById,
  getResumeWithSignedUrl,
  listResumes,
  setActiveResume,
} from "./service";
import { isR2Configured, getResumeStream } from "./r2";
import { listResumesQuerySchema, mimeToFileType } from "./types";
import { setActiveBodySchema } from "./types";

const uuidParamSchema = z.string().uuid();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_RESUME_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    const type = mimeToFileType(file.mimetype);
    if (!type) {
      cb(new Error("Only PDF and DOCX files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const router = express.Router();

router.use(asyncHandler(requireAuth));

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const queryResult = listResumesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const { page, limit } = queryResult.data;
    if (!isR2Configured()) {
      return res.json({ items: [], page, limit, total: 0 });
    }
    const user = req.user!;
    const { items, total } = await listResumes(user.id, page, limit);
    res.json({ items, page, limit, total });
  }),
);

router.post(
  "/",
  resumesUploadRateLimiter(),
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!isR2Configured()) {
      return res.status(503).json({
        error: "SERVICE_UNAVAILABLE",
        message: "Resume storage is not configured",
        statusCode: 503,
      });
    }
    const user = req.user!;
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file || !file.buffer) {
      throw new ValidationError(
        'No file uploaded. Send multipart/form-data with field "file" (PDF or DOCX).',
      );
    }
    const fileType = mimeToFileType(file.mimetype);
    if (!fileType) {
      throw new ValidationError(
        "Invalid file type. Only PDF and DOCX are allowed.",
      );
    }
    const fileName =
      file.originalname?.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255) ||
      `resume.${fileType}`;
    const row = await createResume(
      user.id,
      file.buffer,
      fileName,
      fileType,
      file.size,
    );
    res.status(201).json({
      data: {
        id: row.id,
        fileName: row.fileName,
        fileType: row.fileType,
        fileSizeBytes: row.fileSizeBytes,
        isActive: row.isActive,
        createdAt: row.createdAt?.toISOString() ?? null,
      },
    });
  }),
);

router.get(
  "/:id/preview",
  asyncHandler(async (req: Request, res: Response) => {
    if (!isR2Configured()) {
      return res.status(503).json({
        error: "SERVICE_UNAVAILABLE",
        message: "Resume storage is not configured",
        statusCode: 503,
      });
    }
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) throw new ValidationError("Invalid resume id");
    const row = await getResumeById(user.id, idResult.data);
    if (row.fileType !== "pdf") {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Preview is only available for PDF resumes",
        statusCode: 400,
      });
    }
    const { stream, contentType } = await getResumeStream(row.s3Key);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self'");
    stream.pipe(res);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    if (!isR2Configured()) {
      return res.status(503).json({
        error: "SERVICE_UNAVAILABLE",
        message: "Resume storage is not configured",
        statusCode: 503,
      });
    }
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) throw new ValidationError("Invalid resume id");
    const row = await getResumeWithSignedUrl(user.id, idResult.data);
    res.json({
      data: {
        id: row.id,
        fileName: row.fileName,
        fileType: row.fileType,
        fileSizeBytes: row.fileSizeBytes,
        isActive: row.isActive,
        signedUrl: row.signedUrl,
        createdAt: row.createdAt?.toISOString() ?? null,
      },
    });
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    if (!isR2Configured()) {
      return res.status(503).json({
        error: "SERVICE_UNAVAILABLE",
        message: "Resume storage is not configured",
        statusCode: 503,
      });
    }
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) throw new ValidationError("Invalid resume id");
    const bodyResult = setActiveBodySchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(
        bodyResult.error.errors.map((e) => e.message).join("; "),
      );
    }
    const row = await setActiveResume(
      user.id,
      idResult.data,
      bodyResult.data.isActive,
    );
    res.json({
      data: {
        id: row.id,
        fileName: row.fileName,
        fileType: row.fileType,
        fileSizeBytes: row.fileSizeBytes,
        isActive: row.isActive,
        createdAt: row.createdAt?.toISOString() ?? null,
      },
    });
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    if (!isR2Configured()) {
      return res.status(503).json({
        error: "SERVICE_UNAVAILABLE",
        message: "Resume storage is not configured",
        statusCode: 503,
      });
    }
    const user = req.user!;
    const idResult = uuidParamSchema.safeParse(req.params.id);
    if (!idResult.success) throw new ValidationError("Invalid resume id");
    await deleteResume(user.id, idResult.data);
    res.status(204).send();
  }),
);

export default router;
