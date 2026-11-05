// Renders an event's announcement or reminder email for the preview pane.
import { NextResponse, type NextRequest } from 'next/server';
import { getViewer } from '@/lib/auth/viewer';
import { toEvent } from '@/lib/content/db-source';
import { renderFor } from '@/lib/email/campaigns';
import { serviceClient } from '@/lib/supabase/clients';

export async function GET(request: NextRequest, ctx: RouteContext<'/admin/events/[id]/email-preview'>) {
  const viewer = await getViewer();
  if (!viewer?.staffRole) return new NextResponse('Not authorised', { status: 401 });
  const { id } = await ctx.params;
  const db = serviceClient();
  const row = (await db.from('events').select('*').eq('id', id).maybeSingle()).data;
  if (!row) return new NextResponse('Not found', { status: 404 });
  const settings = (await db.from('site_content').select('value').eq('key', 'settings').maybeSingle()).data?.value as { mailingAddress?: string } | undefined;
  const kind = request.nextUrl.searchParams.get('kind') === 'reminder' ? 'reminder' : 'announcement';
  const mail = renderFor(kind, toEvent(row), { email: viewer.contactEmail, firstName: viewer.firstName, unsubscribeUrl: '#', manageUrl: '#' }, settings?.mailingAddress);
  return new NextResponse(mail.html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
