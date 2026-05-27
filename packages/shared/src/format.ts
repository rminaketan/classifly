/**
 * Indian-locale formatting helpers. Used by both web and mobile clients.
 */

/** Format INR with lakh/crore convention. 525000 → "₹5.25 L", 1.2e7 → "₹1.20 Cr". */
export function formatINR(amount: number | null | undefined, opts?: { compact?: boolean }): string {
  if (amount == null) return '—';
  const compact = opts?.compact ?? true;
  if (!compact || amount < 100_000) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  if (amount < 10_000_000) {
    return `₹${(amount / 100_000).toFixed(2).replace(/\.?0+$/, '')} L`;
  }
  return `₹${(amount / 10_000_000).toFixed(2).replace(/\.?0+$/, '')} Cr`;
}

/** Mask phone: "+91 9876543210" → "+91 98****3210" */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const last10 = digits.slice(-10);
  return `+91 ${last10.slice(0, 2)}****${last10.slice(-4)}`;
}

/** "2 hours ago" / "3 days ago" with Indian short forms. */
export function timeAgo(dateInput: string | Date | null | undefined, now: Date = new Date()): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Slugify a string for URL paths. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
