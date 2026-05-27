import { NextResponse } from 'next/server';
import { uploadUrlRequestSchema, UPLOAD_LIMITS } from '@classifly/shared';
import { getCurrentUser } from '@/lib/auth';
import { presignUpload } from '@/lib/r2';
import { isStorageConfigured } from '@/lib/env';

/**
 * POST /api/upload-url
 *
 * Body: { kind, contentType, sizeBytes, listingId? }
 * Returns: { uploadUrl, key, publicUrl }
 *
 * The client uploads the file directly to R2 with `fetch(uploadUrl, { method: 'PUT', body: file })`,
 * then POSTs the returned key back to e.g. `/api/listings/[id]/media` to register it.
 */
export async function POST(req: Request) {
  if (!isStorageConfigured) {
    return NextResponse.json(
      { error: 'Object storage not configured. Set CF_R2_* env vars.' },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const parsed = uploadUrlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'invalid input' }, { status: 400 });
  }

  const { kind, contentType, sizeBytes, listingId } = parsed.data;

  // Enforce per-kind size + type whitelists
  if (kind === 'listing' || kind === 'avatar' || kind === 'review') {
    if (!(UPLOAD_LIMITS.imageMimes as readonly string[]).includes(contentType)) {
      return NextResponse.json({ error: 'unsupported image type' }, { status: 400 });
    }
    if (sizeBytes > UPLOAD_LIMITS.imageMaxBytes) {
      return NextResponse.json({ error: 'image too large (max 5 MB)' }, { status: 400 });
    }
  } else if (kind === 'resume') {
    if (contentType !== 'application/pdf') {
      return NextResponse.json({ error: 'resume must be PDF' }, { status: 400 });
    }
    if (sizeBytes > UPLOAD_LIMITS.resumeMaxBytes) {
      return NextResponse.json({ error: 'resume too large (max 2 MB)' }, { status: 400 });
    }
  }

  const ext = contentTypeToExt(contentType);
  const uuid = crypto.randomUUID();
  const key = keyFor(kind, user.id, uuid, ext, listingId);
  const bucket: 'public' | 'private' = kind === 'kyc' || kind === 'resume' ? 'private' : 'public';

  const presigned = await presignUpload({
    bucket,
    key,
    contentType,
    contentLength: sizeBytes,
    uploadedByUserId: user.id,
  });

  return NextResponse.json(presigned);
}

function keyFor(
  kind: string,
  userId: string,
  uuid: string,
  ext: string,
  listingId?: string,
): string {
  switch (kind) {
    case 'listing':
      return `listings/${listingId ?? 'tmp'}/${uuid}.${ext}`;
    case 'avatar':
      return `avatars/${userId}.${ext}`;
    case 'review':
      return `review-photos/${userId}/${uuid}.${ext}`;
    case 'resume':
      return `resumes/${userId}.${ext}`;
    case 'voice_cv':
      return `voice-cvs/${userId}.${ext}`;
    case 'kyc':
      return `kyc/${userId}/${uuid}.${ext}`;
    default:
      return `tmp/${userId}/${uuid}.${ext}`;
  }
}

function contentTypeToExt(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'audio/ogg': 'opus',
    'audio/webm': 'webm',
    'application/pdf': 'pdf',
  };
  return map[contentType] ?? 'bin';
}
