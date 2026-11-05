// Sends any scheduled emails that are due. Call every few minutes with
//   Authorization: Bearer $CRON_SECRET
// (Supabase pg_cron + pg_net, Vercel Cron, or any uptime pinger — see docs/OPERATIONS.md).
import { NextResponse, type NextRequest } from 'next/server';
import { dispatchDue } from '@/lib/email/campaigns';

// A big announcement can take a while to send.
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await dispatchDue();
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
