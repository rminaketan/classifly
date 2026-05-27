/**
 * Cloudflare R2 (S3-compatible) helper. Mints short-lived presigned PUT URLs
 * so the browser can upload directly to R2 without proxying through our API.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env, isStorageConfigured } from './env';

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (!isStorageConfigured) {
    throw new Error('R2 not configured — set CF_R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY');
  }
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY,
        secretAccessKey: env.R2_SECRET_KEY,
      },
    });
  }
  return _client;
}

export interface PresignedUpload {
  /** PUT this URL with the raw file body. */
  uploadUrl: string;
  /** Deterministic key inside the bucket. */
  key: string;
  /** Public URL the file will live at once uploaded (public bucket only). */
  publicUrl: string;
}

export async function presignUpload(opts: {
  bucket?: 'public' | 'private';
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds?: number;
  uploadedByUserId?: string;
}): Promise<PresignedUpload> {
  const bucket = opts.bucket === 'private' ? env.R2_BUCKET_PRIVATE : env.R2_BUCKET_PUBLIC;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: opts.key,
    ContentType: opts.contentType,
    ContentLength: opts.contentLength,
    Metadata: opts.uploadedByUserId ? { uploadedBy: opts.uploadedByUserId } : undefined,
  });
  const uploadUrl = await getSignedUrl(getClient(), cmd, {
    expiresIn: opts.expiresInSeconds ?? 300,
  });
  const publicUrl =
    bucket === env.R2_BUCKET_PUBLIC
      ? `${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${opts.key}`
      : ''; // private bucket served via separate signed GETs
  return { uploadUrl, key: opts.key, publicUrl };
}

export async function deleteObject(bucketKind: 'public' | 'private', key: string): Promise<void> {
  const bucket = bucketKind === 'private' ? env.R2_BUCKET_PRIVATE : env.R2_BUCKET_PUBLIC;
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Image URL with Cloudflare on-the-fly resize. */
export function cdnImage(url: string, opts: { w?: number; h?: number; q?: number } = {}): string {
  if (!url) return '';
  const w = opts.w ?? 800;
  const h = opts.h ? `,height=${opts.h}` : '';
  const q = opts.q ?? 75;
  const params = `width=${w}${h},quality=${q},format=auto`;
  // Cloudflare image-resize requires the bucket be behind your CF zone.
  const base = env.NEXT_PUBLIC_R2_PUBLIC_URL.replace(/\/$/, '');
  if (!url.startsWith(base)) return url;
  const path = url.slice(base.length);
  return `${base}/cdn-cgi/image/${params}${path}`;
}
