'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createListingSchema, type CreateListingInput } from '@classifly/shared';
import { createListingAction } from './actions';

interface Category {
  id: string;
  slug: string;
  name: string;
  vertical: 'goods' | 'jobs' | 'services' | 'real_estate';
  parent_id: string | null;
  depth: number;
  is_leaf: boolean;
}

interface City {
  id: string;
  name: string;
  state: string;
}

export function PostAdForm({ categories, cities }: { categories: Category[]; cities: City[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [parentCatId, setParentCatId] = useState<string>('');
  const parentCats = useMemo(() => categories.filter((c) => c.depth === 0), [categories]);
  const childCats = useMemo(
    () => categories.filter((c) => c.parent_id === parentCatId && c.is_leaf),
    [categories, parentCatId],
  );

  function handleSubmit(formData: FormData) {
    setError(null);

    const childId = String(formData.get('category_id') ?? '');
    const parent = categories.find((c) => c.id === parentCatId);
    if (!childId || !parent) {
      setError('Please choose a category');
      return;
    }

    const priceRaw = formData.get('price');
    const input: CreateListingInput = {
      category_id: childId,
      vertical: parent.vertical,
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? '') || undefined,
      price: priceRaw ? Number(priceRaw) : null,
      price_type: (formData.get('price_type') as any) ?? 'fixed',
      condition: (formData.get('condition') as any) || null,
      city_id: String(formData.get('city_id') ?? '') || null,
      address: String(formData.get('address') ?? '') || undefined,
      language: 'en',
      attrs: {},
    };

    const parsed = createListingSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form');
      return;
    }

    startTransition(async () => {
      const result = await createListingAction(parsed.data);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/listings/${result.id}`);
    });
  }

  return (
    <form action={handleSubmit} className="card space-y-5 p-6">
      <div>
        <div className="label mb-2">Category</div>
        <div className="grid grid-cols-2 gap-3">
          <select
            className="input"
            value={parentCatId}
            onChange={(e) => setParentCatId(e.target.value)}
            required
          >
            <option value="">Choose category…</option>
            {parentCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="input" name="category_id" required disabled={!childCats.length}>
            <option value="">{childCats.length ? 'Choose sub-category…' : '—'}</option>
            {childCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label mb-2 block" htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          className="input"
          placeholder="e.g. Maruti Swift VXI 2019 — Single owner, well maintained"
          minLength={8}
          maxLength={120}
          required
        />
      </div>

      <div>
        <label className="label mb-2 block" htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="input"
          placeholder="Tell buyers about the condition, accessories included, why you're selling, etc."
          maxLength={4000}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="label mb-2 block" htmlFor="price">Price (₹)</label>
          <input id="price" name="price" type="number" min={0} className="input" />
        </div>
        <div>
          <label className="label mb-2 block" htmlFor="price_type">Price type</label>
          <select id="price_type" name="price_type" className="input" defaultValue="fixed">
            <option value="fixed">Fixed</option>
            <option value="negotiable">Negotiable</option>
            <option value="free">Free</option>
            <option value="on_request">On request</option>
          </select>
        </div>
        <div>
          <label className="label mb-2 block" htmlFor="condition">Condition</label>
          <select id="condition" name="condition" className="input" defaultValue="">
            <option value="">— optional —</option>
            <option value="new">New</option>
            <option value="like_new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="for_parts">For parts</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="label mb-2 block" htmlFor="city_id">City</label>
          <select id="city_id" name="city_id" className="input" required>
            <option value="">Choose city…</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.state}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-2 block" htmlFor="address">Locality / area (optional)</label>
          <input id="address" name="address" className="input" placeholder="e.g. Whitefield" />
        </div>
      </div>

      <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
        <strong>Photos:</strong> add them after publishing — you'll see an "Add photos" button on the
        listing page. Listings with 5+ clear photos get 3× more chats.
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-neutral-200 pt-5">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Posting…' : 'Post my ad'}
        </button>
      </div>
    </form>
  );
}
