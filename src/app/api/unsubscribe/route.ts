// One-click unsubscribe (RFC 8058): mail apps POST here from their own
// "Unsubscribe" button, using the List-Unsubscribe header on our emails.
import { NextResponse, type NextRequest } from 'next/server';
import { serviceClient } from '@/lib/supabase/clients';

export async function POST(request: NextRequest) {
  const t = request.nextUrl.searchParams.get('t') ?? '';
  if (/^[0-9a-f-]{36}$/i.test(t)) {
    await serviceClient().from('people').update({ subscribed: false, unsubscribed_at: new Date().toISOString() }).eq('unsubscribe_token', t);
  }
  return new NextResponse(null, { status: 204 });
}
