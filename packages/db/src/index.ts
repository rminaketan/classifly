/**
 * @classifly/db
 * Re-exports the generated Supabase Database types + a couple of
 * convenience aliases for tables we touch most.
 *
 * Regenerate types after schema changes:
 *   pnpm db:types
 */
export type { Database, Json } from './types';
export type Tables = import('./types').Database['public']['Tables'];
export type Enums = import('./types').Database['public']['Enums'];

// Convenience row aliases (read shape) for the high-traffic tables.
export type Profile = Tables['profiles']['Row'];
export type Listing = Tables['listings']['Row'];
export type ListingMedia = Tables['listing_media']['Row'];
export type Category = Tables['categories']['Row'];
export type City = Tables['cities']['Row'];
export type Conversation = Tables['conversations']['Row'];
export type Message = Tables['messages']['Row'];
