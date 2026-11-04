// Loads the content transcribed from the Wix site into the database.
// Safe to re-run: content rows are upserted by key/slug.
//
// Usage: npm run db:seed
//   (ADMIN_EMAILS in .env.local grants admin — see below)
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import * as seed from '../src/lib/content/seed.ts';
import type { ImageRef } from '../src/lib/content/types.ts';

try {
  process.loadEnvFile('.env.local');
} catch {
  /* env may come from the shell */
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.local).');
const db = createClient(url, key, { auth: { persistSession: false } });

const ROOT = process.cwd();
const meta: Record<string, { blurDataURL: string; width: number; height: number }> = JSON.parse(
  await fs.readFile(path.join(ROOT, 'src/lib/content/media-meta.json'), 'utf8'),
);
const banner = JSON.parse(await fs.readFile(path.join(ROOT, 'src/lib/content/collage-banner.json'), 'utf8'));
const blur = <T extends ImageRef>(img: T): T => ({ ...img, blurDataURL: img.blurDataURL ?? meta[img.src]?.blurDataURL });

function ok<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as NonNullable<T>;
}

// --- page content -----------------------------------------------------------
const { members, ...teamPage } = seed.team;
const content = [
  { key: 'settings', value: seed.settings },
  { key: 'home', value: seed.home },
  { key: 'mission', value: seed.mission },
  { key: 'team_page', value: teamPage },
  { key: 'donate', value: seed.donate },
  { key: 'contact', value: seed.contact },
  { key: 'collage_banner', value: banner },
];
ok(await db.from('site_content').upsert(content), 'site_content');
console.log('site content:', content.map((c) => c.key).join(', '));

// --- leadership: a person record for each, linked to their Team card --------------
ok(await db.from('team_members').delete().neq('id', '00000000-0000-0000-0000-000000000000'), 'team_members.clear');
for (const [i, m] of members.entries()) {
  const [first, ...rest] = m.name.split(' ');
  const person = ok(
    await db
      .from('people')
      .upsert({ email: m.email!, first_name: first, last_name: rest.join(' '), source: 'admin' }, { onConflict: 'email' })
      .select('id')
      .single(),
    `people ${m.email}`,
  );
  ok(
    await db.from('team_members').insert({
      person_id: person.id,
      name: m.name,
      role: m.role,
      email: m.email,
      photo: blur(m.photo),
      x_url: m.x ?? null,
      linkedin_url: m.linkedin ?? null,
      sort_order: i,
    }),
    `team ${m.name}`,
  );
}
console.log('team members:', members.length);

// --- banner photos ------------------------------------------------------------
ok(await db.from('collage_photos').delete().neq('id', '00000000-0000-0000-0000-000000000000'), 'collage.clear');
ok(
  await db.from('collage_photos').insert(
    seed.collage.map((p, i) => ({ src: p.src, width: p.width, height: p.height, emphasis: p.emphasis ?? 1, sort_order: i })),
  ),
  'collage_photos',
);
console.log('collage photos:', seed.collage.length);

// --- events -------------------------------------------------------------------
for (const e of seed.events) {
  ok(
    await db.from('events').upsert(
      {
        slug: e.slug,
        status: e.status,
        publish_at: e.publishAt ?? null,
        visibility: e.visibility ?? 'public',
        title: e.title,
        summary: e.summary,
        description: e.description,
        starts_at: e.startsAt,
        ends_at: e.endsAt,
        location_name: e.locationName,
        address: e.address ?? null,
        image: blur(e.image),
        rsvp_mode: e.rsvp.mode,
        rsvp_closes_at: e.rsvp.closesAt ?? null,
        capacity: e.rsvp.capacity ?? null,
        partner: e.rsvp.partner ?? null,
        feature_on_home: e.featureOnHome,
        home_card: e.homeCard ?? null,
        recap: e.recap ? { ...e.recap, photos: e.recap.photos.map(blur) } : null,
      },
      { onConflict: 'slug' },
    ),
    `event ${e.slug}`,
  );
}
console.log('events:', seed.events.length);

// --- admins -------------------------------------------------------------------
// ADMIN_EMAILS: people separated by ";", each person's addresses separated by ",".
// All addresses of one person sign in to the same account, e.g.
//   ADMIN_EMAILS="sam@austinunion.org,sam@student.uaustin.org;jane@austinunion.org"
for (const group of (process.env.ADMIN_EMAILS ?? '').split(';')) {
  const emails = group.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!emails.length) continue;
  const known = ok(await db.from('person_emails').select('person_id, email').in('email', emails), 'person_emails');
  let personId = known[0]?.person_id as string | undefined;
  if (!personId) {
    personId = ok(await db.from('people').insert({ email: emails[0], source: 'admin' }).select('id').single(), 'people').id;
  }
  for (const email of emails) {
    ok(await db.from('person_emails').upsert({ email, person_id: personId }, { onConflict: 'email', ignoreDuplicates: true }), `email ${email}`);
  }
  ok(await db.from('staff').upsert({ person_id: personId, role: 'admin' }), 'staff');
  console.log('admin:', emails.join(' + '));
}
