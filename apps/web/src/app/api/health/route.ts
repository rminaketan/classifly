import { NextResponse } from 'next/server';
import { isConfigured, isStorageConfigured } from '@/lib/env';

/** Health check endpoint used by Better Stack monitors. */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    configured: { supabase: isConfigured, storage: isStorageConfigured },
    timestamp: new Date().toISOString(),
  });
}
