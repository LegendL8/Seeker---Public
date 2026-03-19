import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "stream";

import { env } from "../config";
import { logger } from "../logger";

let client: S3Client | null = null;

function getR2Endpoint(): string {
  const accountId = env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID not set");
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function getR2Client(): S3Client {
  if (!client) {
    if (
      !env.R2_ACCESS_KEY_ID ||
      !env.R2_SECRET_ACCESS_KEY ||
      !env.R2_BUCKET_RESUMES
    ) {
      throw new Error(
        "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_RESUMES must be set for resume uploads",
      );
    }
    const endpoint = getR2Endpoint();
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
    logger.info({ endpoint }, "R2 client initialized");
  }
  return client;
}

export function isR2Configured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_RESUMES,
  );
}

export function getResumesBucket(): string {
  const bucket = env.R2_BUCKET_RESUMES;
  if (!bucket) throw new Error("R2_BUCKET_RESUMES not set");
  return bucket;
}

export async function uploadResumeToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const r2 = getR2Client();
  const bucket = getResumesBucket();
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

const SIGNED_URL_EXPIRY_SECONDS = 15 * 60;

export async function getResumeSignedUrl(key: string): Promise<string> {
  const r2 = getR2Client();
  const bucket = getResumesBucket();
  const url = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: "inline",
    }),
    { expiresIn: SIGNED_URL_EXPIRY_SECONDS },
  );
  return url;
}

export interface ResumeStreamResult {
  stream: Readable;
  contentType: string;
}

export async function getResumeStream(
  key: string,
): Promise<ResumeStreamResult> {
  const r2 = getR2Client();
  const bucket = getResumesBucket();
  const response = await r2.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const body = response.Body;
  if (!body) throw new Error("Empty body from R2");
  const contentType = response.ContentType ?? "application/octet-stream";
  return { stream: body as Readable, contentType };
}

export async function deleteResumeFromR2(key: string): Promise<void> {
  const r2 = getR2Client();
  const bucket = getResumesBucket();
  await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
