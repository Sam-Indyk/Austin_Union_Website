// Guest list as a spreadsheet (CSV), for door lists and sharing with UATX.
import { NextResponse } from 'next/server';
import { getViewer } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const when = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Chicago' });

export async function GET(_req: Request, ctx: RouteContext<'/admin/events/[id]/guests/export'>) {
  const viewer = await getViewer();
  if (!viewer?.staffRole) return new NextResponse('Not authorised', { status: 401 });
  const { id } = await ctx.params;
  const db = serviceClient();
  const event = (await db.from('events').select('slug').eq('id', id).maybeSingle()).data;
  if (!event) return new NextResponse('Not found', { status: 404 });
  const rows = (await db.from('rsvps').select('first_name, last_name, email, status, checked_in_at, created_at').eq('event_id', id).order('last_name')).data ?? [];
  const lines = [
    ['First name', 'Last name', 'Email', 'Status', 'Checked in', 'RSVP’d'].join(','),
    ...rows.map((r) =>
      [r.first_name, r.last_name === '—' ? '' : r.last_name, r.email.endsWith('@guests.austinunion.org') ? '' : r.email, r.status, r.checked_in_at ? when.format(new Date(r.checked_in_at)) : '', when.format(new Date(r.created_at))]
        .map((v) => cell(String(v)))
        .join(','),
    ),
  ];
  return new NextResponse('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}-guests.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
