# Object Storage Layout (Cloudflare R2)

Files do not live in Postgres. We store them in Cloudflare R2 (S3-compatible, free up to 10 GB, **no egress fees**) and keep only URLs and metadata in the database.

## Buckets

| Bucket | Visibility | Used for | Lifecycle |
|---|---|---|---|
| `classifly-media-prod` | public-read | Listing photos/videos, profile avatars, review photos | 60-day expiry rule on `tmp/*` prefix |
| `classifly-media-dev`  | public-read | Same, for the dev Supabase project | Same |
| `classifly-private-prod` | private | KYC documents, voice CVs (consumer wants control), invoices | 7-year retention (DPDP) |
| `classifly-backups-prod` | private | Nightly `pg_dump`, content-type backups | 90-day retention |

## Key naming

All keys are lower-case, dash-separated, deterministic per parent entity. We use UUIDv7 in keys so they sort by time and we can range-list recent uploads cheaply.

```
listings/{listing_id}/{media_id}.{webp|jpg|mp4}
listings/{listing_id}/thumb/{media_id}.webp
avatars/{user_id}.webp
review-photos/{review_id}/{idx}.webp
resumes/{user_id}.pdf
voice-cvs/{user_id}.opus
kyc/{user_id}/{type}-{timestamp}.pdf         ← private bucket
invoices/{order_id}.pdf                       ← private bucket
backups/db/{yyyy}/{mm}/{dd}/{git-sha}.sql.gz  ← private bucket
tmp/{user_id}/{uuid}                          ← 60-day expiry, used during multi-step uploads
```

## Upload flow (presigned URLs)

The client never sends large files through the API. We mint a short-lived presigned PUT URL and the client uploads directly to R2.

```ts
// api/upload-url/route.ts (Next.js)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

export async function POST(req: Request) {
  const user = await getUser(req);                       // Supabase auth
  if (!user) return new Response('unauthorized', { status: 401 });

  const { kind, contentType, sizeBytes } = await req.json();
  validate(kind, contentType, sizeBytes);                // enforce limits

  const key = makeKey(kind, user.id);                    // see naming above
  const cmd = new PutObjectCommand({
    Bucket: 'classifly-media-prod',
    Key: key,
    ContentType: contentType,
    ContentLength: sizeBytes,
    Metadata: { uploadedBy: user.id },
  });
  const url = await getSignedUrl(r2, cmd, { expiresIn: 300 });
  return Response.json({ url, key, publicUrl: `https://media.classifly.in/${key}` });
}
```

After upload the client posts the `key` back to e.g. `POST /api/listings/{id}/media` and we insert a row into `listing_media`. A Cloudflare Worker watching R2 events validates the object exists and is under the size cap; if not, we delete the orphan after 24 h.

## Image processing

We do not pre-generate thumbnails. Cloudflare's transparent image-resizing layer rewrites URLs on the fly:

```
Original :  https://media.classifly.in/listings/<lid>/<mid>.jpg
Thumb    :  https://media.classifly.in/cdn-cgi/image/width=400,quality=75,format=auto/listings/<lid>/<mid>.jpg
Avatar   :  https://media.classifly.in/cdn-cgi/image/width=80,height=80,fit=cover,format=auto/avatars/<uid>.webp
```

Free up to a few thousand resize requests per day; **Cloudflare Pro plan is required for image-resizing at scale (~₹1 700/mo)** — we add this at M2 when traffic justifies it.

## Limits we enforce in the application

| Limit | Value | Where enforced |
|---|---|---|
| Max image upload size | 5 MB | Presigned URL `ContentLength`, plus client-side compression to WebP < 200 KB |
| Max images per listing | 10 (free tier), 25 (featured) | API at insert into `listing_media` |
| Max video size | 30 MB, 30 s | Client + Worker validate |
| Max voice-CV length | 90 seconds | Client side |
| Max resume size | 2 MB PDF only | API |
| Total per-user upload quota | 100 MB / day (free), 1 GB / day (verified pro) | Tracked via Upstash Redis counter |

## Public domain & CDN

`media.classifly.in` is a Cloudflare custom domain pointed at the R2 bucket. Cloudflare CDN sits in front, serving everything from the nearest edge — Mumbai, Chennai, Delhi POPs are all on the free plan. **No egress charges to users**, which is the single biggest difference vs S3+CloudFront.

## Backups & DR

- Nightly `pg_dump` (Supabase scheduled function or GitHub Actions cron) writes to `classifly-backups-prod/db/...`.
- Weekly cross-provider copy: a Cloudflare Worker uses the R2-to-Backblaze-B2 replicator to copy the latest dump to a B2 bucket (10 GB free at B2 too).
- Restore drill: quarterly. Pick a random nightly dump, restore to a throwaway Supabase project, run smoke tests against it.

## Privacy & compliance

- **Public bucket** never holds KYC documents, government-ID scans, or anything PII-sensitive.
- **Private bucket** is served only via short-lived signed URLs (5 min) and only to the data owner or their authorised counter-party.
- **EXIF stripping**: a Cloudflare Worker on the upload event removes GPS/serial-number metadata from images before they go live.
- **Right-to-erasure**: an account-delete background job lists all R2 prefixes for the user (`avatars/{uid}.*`, `voice-cvs/{uid}.*`, `resumes/{uid}.*`, `kyc/{uid}/*`) and deletes them within 30 days of the request.

## Migration ramp

| Trigger | Move to |
|---|---|
| > 50 GB stored | Stay on R2; pay-as-you-go is still cheap (~₹1.30/GB-month) |
| > 1 M image-resize requests / day | Cloudflare Pro (₹1 700/mo); or evaluate ImgProxy on Oracle Cloud free tier |
| Need fine-grained ACLs per bucket | Cloudflare D1 + Worker-based signer (still free), or move sensitive bucket to AWS S3 with KMS |
| Need video transcoding | Cloudflare Stream ($1/1000 min stored + $1/1000 min watched) |
