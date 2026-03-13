import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config";
import { logger } from "../logger";

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!client) {
    const region = env.AWS_REGION;
    if (!region || !env.S3_BUCKET_RESUMES) {
      throw new Error(
        "S3_BUCKET_RESUMES and AWS_REGION must be set for resume uploads",
      );
    }
    client = new S3Client({ region });
    logger.info({ region }, "S3 client initialized");
  }
  return client;
}

export function isS3Configured(): boolean {
  return Boolean(env.S3_BUCKET_RESUMES && env.AWS_REGION);
}

export function getResumesBucket(): string {
  const bucket = env.S3_BUCKET_RESUMES;
  if (!bucket) throw new Error("S3_BUCKET_RESUMES not set");
  return bucket;
}

export async function uploadResumeToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const s3 = getS3Client();
  const bucket = getResumesBucket();
  await s3.send(
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
  const s3 = getS3Client();
  const bucket = getResumesBucket();
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: SIGNED_URL_EXPIRY_SECONDS },
  );
  return url;
}

export async function deleteResumeFromS3(key: string): Promise<void> {
  const s3 = getS3Client();
  const bucket = getResumesBucket();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
