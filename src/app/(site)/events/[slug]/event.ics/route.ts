import { icsFor } from '@/lib/calendar';
import { getEventBySlug } from '@/lib/content/repo';

export async function GET(_req: Request, ctx: RouteContext<'/events/[slug]/event.ics'>) {
  const { slug } = await ctx.params;
  const found = await getEventBySlug(slug);
  if (!found) return new Response('Not found', { status: 404 });
  return new Response(icsFor(found.event), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  });
}
