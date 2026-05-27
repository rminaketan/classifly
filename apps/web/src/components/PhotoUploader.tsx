'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, UploadCloud, X, AlertCircle, ImagePlus } from 'lucide-react';
import { UPLOAD_LIMITS } from '@classifly/shared';
import {
  uploadListingPhoto,
  deleteListingPhoto,
  type UploadedMedia,
  type UploadProgress,
} from '@/lib/upload';

interface ExistingMedia {
  id: string;
  url: string;
  sort_order: number;
}

interface PendingUpload {
  id: string;            // local-only id for tracking the row
  file: File;
  previewUrl: string;
  progress: UploadProgress;
  error?: string;
}

export function PhotoUploader({
  listingId,
  existing,
  maxImages = UPLOAD_LIMITS.maxImagesPerListing,
}: {
  listingId: string;
  existing: ExistingMedia[];
  maxImages?: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<ExistingMedia[]>(existing);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const remainingSlots = Math.max(0, maxImages - media.length - pending.length);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setGlobalError(null);

      const accepted = Array.from(files)
        .filter((f) => (UPLOAD_LIMITS.imageMimes as readonly string[]).includes(f.type))
        .slice(0, remainingSlots);

      if (accepted.length === 0) {
        setGlobalError('No supported images selected. Use JPG, PNG, or WebP.');
        return;
      }

      const newPending: PendingUpload[] = accepted.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: { stage: 'compressing' },
      }));
      setPending((p) => [...p, ...newPending]);

      // Run uploads in parallel (R2 is fine with concurrent puts).
      await Promise.all(
        newPending.map(async (item) => {
          try {
            const uploaded: UploadedMedia = await uploadListingPhoto({
              listingId,
              file: item.file,
              onProgress: (p) =>
                setPending((cur) =>
                  cur.map((x) => (x.id === item.id ? { ...x, progress: p } : x)),
                ),
            });
            setMedia((cur) => [
              ...cur,
              { id: uploaded.id, url: uploaded.url, sort_order: uploaded.sort_order },
            ]);
            setPending((cur) => cur.filter((x) => x.id !== item.id));
            URL.revokeObjectURL(item.previewUrl);
          } catch (err) {
            setPending((cur) =>
              cur.map((x) =>
                x.id === item.id
                  ? { ...x, progress: { stage: 'error' }, error: errMsg(err) }
                  : x,
              ),
            );
          }
        }),
      );
      router.refresh();
    },
    [listingId, remainingSlots, router],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const onRemove = useCallback(
    async (mediaId: string) => {
      const prev = media;
      setMedia((cur) => cur.filter((m) => m.id !== mediaId));
      try {
        await deleteListingPhoto(listingId, mediaId);
        router.refresh();
      } catch (err) {
        setMedia(prev); // restore on error
        setGlobalError(errMsg(err));
      }
    },
    [listingId, media, router],
  );

  const dismissPending = useCallback(
    (id: string) => setPending((cur) => cur.filter((x) => x.id !== id)),
    [],
  );

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Your photos</h2>
        <span className="text-xs text-neutral-500">
          {media.length + pending.length} / {maxImages}
        </span>
      </div>

      {globalError && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {/* Existing photos */}
        {media
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((m, idx) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" className="h-full w-full object-cover" />
              {idx === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-neutral-900">
                  COVER
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

        {/* Pending uploads */}
        {pending.map((p) => (
          <div
            key={p.id}
            className="relative aspect-square overflow-hidden rounded-lg bg-neutral-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
              {p.progress.stage === 'error' ? (
                <div className="px-2 text-center text-red-200">
                  <AlertCircle className="mx-auto mb-1 h-4 w-4" />
                  <div className="leading-tight">{p.error ?? 'Failed'}</div>
                  <button
                    type="button"
                    className="mt-1 underline"
                    onClick={() => dismissPending(p.id)}
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <span>{stageLabel(p.progress)}</span>
              )}
            </div>
            {p.progress.stage === 'uploading' && typeof p.progress.pct === 'number' && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.round(p.progress.pct * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}

        {/* Add tile */}
        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-600 transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs font-semibold">Add photo</span>
            <span className="text-[10px] text-neutral-400">drop or click</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          if (inputRef.current) inputRef.current.value = ''; // allow re-picking same file
        }}
      />

      <div className="mt-4 flex items-start gap-2 rounded-md border border-primary-100 bg-primary-50 p-3 text-xs text-primary-900">
        <Camera className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div>
          <strong>Tips for great photos:</strong> use daylight, show the item from multiple angles,
          wipe it clean first. Listings with 5+ clear photos get <strong>3× more chats</strong>.
        </div>
      </div>

      {remainingSlots === 0 && (
        <p className="mt-3 text-center text-xs text-neutral-500">
          You've reached the {maxImages}-photo limit for this listing.
        </p>
      )}
    </div>
  );
}

function stageLabel(p: UploadProgress): string {
  switch (p.stage) {
    case 'compressing':
      return 'Compressing…';
    case 'presigning':
      return 'Preparing…';
    case 'uploading':
      return `Uploading ${Math.round((p.pct ?? 0) * 100)}%`;
    case 'registering':
      return 'Almost done…';
    case 'done':
      return 'Done';
    case 'error':
      return 'Failed';
  }
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Unknown error';
}
