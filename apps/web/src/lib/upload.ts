/**
 * Client-side upload helper. Lives in the browser only.
 *
 * Flow:
 *   1. Compress the picked file to WebP (max 1600px, quality 0.82) —
 *      keeps payload under ~200 KB for a typical photo per the lean perf budget.
 *   2. POST /api/upload-url to mint a presigned R2 PUT URL.
 *   3. PUT the WebP blob directly to R2.
 *   4. POST /api/listings/{id}/media to register the row.
 *   5. Return the new media row.
 */

import type { UploadUrlRequest } from '@classifly/shared';

export interface UploadedMedia {
  id: string;
  url: string;
  sort_order: number;
  width?: number | null;
  height?: number | null;
}

export interface UploadProgress {
  stage: 'compressing' | 'presigning' | 'uploading' | 'registering' | 'done' | 'error';
  pct?: number;        // 0..1 for uploading stage
  message?: string;
}

export async function uploadListingPhoto(opts: {
  listingId: string;
  file: File;
  onProgress?: (p: UploadProgress) => void;
}): Promise<UploadedMedia> {
  const { listingId, file, onProgress } = opts;
  const note = (p: UploadProgress) => onProgress?.(p);

  // 1) Compress
  note({ stage: 'compressing' });
  const { blob, width, height } = await compressToWebP(file, {
    maxDim: 1600,
    quality: 0.82,
  });

  // 2) Mint a presigned PUT URL
  note({ stage: 'presigning' });
  const presignReq: UploadUrlRequest = {
    kind: 'listing',
    contentType: 'image/webp',
    sizeBytes: blob.size,
    listingId,
  };
  const presignResp = await fetch('/api/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(presignReq),
  });
  if (!presignResp.ok) {
    const err = (await presignResp.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `presign failed (${presignResp.status})`);
  }
  const { uploadUrl, key } = (await presignResp.json()) as {
    uploadUrl: string;
    key: string;
    publicUrl: string;
  };

  // 3) PUT to R2 with progress via XHR (fetch can't report upload progress)
  note({ stage: 'uploading', pct: 0 });
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', 'image/webp');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) note({ stage: 'uploading', pct: e.loaded / e.total });
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`R2 PUT failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error('R2 PUT network error'));
    xhr.send(blob);
  });

  // 4) Register row
  note({ stage: 'registering' });
  const regResp = await fetch(`/api/listings/${encodeURIComponent(listingId)}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, width, height }),
  });
  if (!regResp.ok) {
    const err = (await regResp.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `register failed (${regResp.status})`);
  }
  const { media } = (await regResp.json()) as { media: UploadedMedia };

  note({ stage: 'done' });
  return media;
}

export async function deleteListingPhoto(listingId: string, mediaId: string): Promise<void> {
  const resp = await fetch(
    `/api/listings/${encodeURIComponent(listingId)}/media?mediaId=${encodeURIComponent(mediaId)}`,
    { method: 'DELETE' },
  );
  if (!resp.ok) {
    const err = (await resp.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `delete failed (${resp.status})`);
  }
}

/**
 * Compress an image File to a WebP Blob using Canvas. Returns the blob plus
 * the final dimensions (useful for layout to avoid CLS on cards).
 *
 * Handles EXIF orientation implicitly via createImageBitmap which respects
 * the orientation flag.
 */
async function compressToWebP(
  file: File,
  opts: { maxDim: number; quality: number },
): Promise<{ blob: Blob; width: number; height: number }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files supported');
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  const scale = Math.min(1, opts.maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas.toBlob returned null'))),
      'image/webp',
      opts.quality,
    ),
  );

  return { blob, width, height };
}
