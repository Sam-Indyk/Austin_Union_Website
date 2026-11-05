'use server';

import { updateTag } from 'next/cache';
import { assertStaff } from '@/lib/auth/viewer';
import { readDoc, rebuildBanner, revertDoc, revisionCount, writeDoc, type DocKey } from '@/lib/content/edit';
import type {
  ContactContent,
  DonateContent,
  HomeContent,
  ImageRef,
  MissionContent,
  MissionSection,
  SiteSettings,
  TeamContent,
} from '@/lib/content/types';
import { uploadImage } from '@/lib/media/upload';
import { plainText, sanitizeRich } from '@/lib/sanitize';
import { serviceClient } from '@/lib/supabase/clients';
import type { Json } from '@/lib/supabase/database.types';

export interface EditorData {
  home: HomeContent;
  mission: MissionContent;
  team_page: Omit<TeamContent, 'members'>;
  donate: DonateContent;
  contact: ContactContent;
  settings: SiteSettings & { mailingAddress?: string };
  team: { id: string; name: string; role: string; email: string; photo: ImageRef; x: string; linkedin: string; active: boolean }[];
  collage: { id: string; src: string; width: number; height: number; emphasis: number; focalX: number; focalY: number }[];
  revisions: Record<DocKey, number>;
}

export type Result = { ok: true; message?: string } | { ok: false; error: string };

const fail = (err: unknown): Result => ({ ok: false, error: err instanceof Error ? err.message : 'Something went wrong.' });

export async function loadEditorData(): Promise<EditorData> {
  await assertStaff();
  const db = serviceClient();
  const keys: DocKey[] = ['home', 'mission', 'team_page', 'donate', 'contact', 'settings'];
  const [docs, team, collage, counts] = await Promise.all([
    Promise.all(keys.map((k) => readDoc(k))),
    db.from('team_members').select('*').order('sort_order'),
    db.from('collage_photos').select('*').order('sort_order'),
    Promise.all(keys.map((k) => revisionCount(k))),
  ]);
  const by = Object.fromEntries(keys.map((k, i) => [k, docs[i]])) as Record<DocKey, unknown>;
  return {
    home: by.home as HomeContent,
    mission: by.mission as MissionContent,
    team_page: by.team_page as Omit<TeamContent, 'members'>,
    donate: by.donate as DonateContent,
    contact: by.contact as ContactContent,
    settings: by.settings as EditorData['settings'],
    team: (team.data ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      email: m.email ?? '',
      photo: m.photo as unknown as ImageRef,
      x: m.x_url ?? '',
      linkedin: m.linkedin_url ?? '',
      active: m.active,
    })),
    collage: (collage.data ?? []).map((p) => ({ id: p.id, src: p.src, width: p.width, height: p.height, emphasis: p.emphasis, focalX: p.focal_x, focalY: p.focal_y })),
    revisions: Object.fromEntries(keys.map((k, i) => [k, counts[i]])) as Record<DocKey, number>,
  };
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
const ORNAMENTS = new Set(['k', 'x', 'W', '&', '(', '4', 'B']);
const THEMES = new Set(['red', 'cream', 'maroon', 'charcoal', 'navy']);
const url = (u: unknown) => {
  const s = String(u ?? '').trim();
  return /^(https?:\/\/|mailto:|tel:)/i.test(s) ? s.slice(0, 500) : '';
};
const text = (s: unknown, max = 300) => plainText(String(s ?? ''), max);

/** Split editor HTML back into the page's paragraph list. */
function paragraphs(html: string): string[] {
  const clean = sanitizeRich(html);
  const ps = clean.match(/<p>[\s\S]*?<\/p>|<ul>[\s\S]*?<\/ul>|<ol>[\s\S]*?<\/ol>/g);
  return ps && ps.length ? ps : clean ? [`<p>${clean}</p>`] : [];
}

function normalize(key: DocKey, v: Record<string, unknown>, current: Record<string, unknown>): unknown {
  switch (key) {
    case 'home': {
      const h = v as unknown as HomeContent & { essayHtml?: string };
      const cur = current as unknown as HomeContent;
      return {
        epigraph: (h.epigraph ?? cur.epigraph).map((l) => text(l, 200)).filter(Boolean),
        essay: h.essayHtml !== undefined ? paragraphs(h.essayHtml) : cur.essay,
        fallbackCard: h.fallbackCard
          ? { title: text(h.fallbackCard.title, 120), subtitle: text(h.fallbackCard.subtitle, 160), linkLabel: text(h.fallbackCard.linkLabel, 40), linkHref: h.fallbackCard.linkHref?.startsWith('#') ? h.fallbackCard.linkHref : url(h.fallbackCard.linkHref) || '#mailing-list' }
          : cur.fallbackCard,
      } satisfies HomeContent;
    }
    case 'mission': {
      const m = v as unknown as MissionContent;
      const section = (s: MissionSection): MissionSection => ({
        id: /^[a-z0-9-]{1,60}$/.test(s.id) ? s.id : `section-${Math.random().toString(36).slice(2, 8)}`,
        heading: text(s.heading, 120),
        ornament: ORNAMENTS.has(s.ornament) ? s.ornament : 'x',
        ornamentColor: s.ornamentColor === 'red' ? 'red' : 'gold',
        theme: (THEMES.has(s.theme) ? s.theme : 'red') as MissionSection['theme'],
        body: sanitizeRich(s.body),
      });
      return {
        title: text(m.title, 80),
        sections: (m.sections ?? []).map(section),
        contactSection: {
          heading: text(m.contactSection.heading, 120),
          ornament: ORNAMENTS.has(m.contactSection.ornament) ? m.contactSection.ornament : '4',
          intro: text(m.contactSection.intro, 300),
          theme: (THEMES.has(m.contactSection.theme) ? m.contactSection.theme : 'red') as MissionSection['theme'],
        },
      } satisfies MissionContent;
    }
    case 'team_page': {
      const t = v as unknown as Omit<TeamContent, 'members'>;
      return { title: text(t.title, 80), motto: text(t.motto, 120), intro: sanitizeRich(t.intro) };
    }
    case 'donate': {
      const d = v as unknown as DonateContent & { bodyHtml?: string };
      return { title: text(d.title, 80), body: d.bodyHtml !== undefined ? paragraphs(d.bodyHtml) : (current as unknown as DonateContent).body, buttonLabel: text(d.buttonLabel, 40) } satisfies DonateContent;
    }
    case 'contact': {
      const c = v as unknown as ContactContent;
      return { title: text(c.title, 80), intro: text(c.intro, 300), formHeading: text(c.formHeading, 80) } satisfies ContactContent;
    }
    case 'settings': {
      const s = v as unknown as SiteSettings & { mailingAddress?: string };
      const cur = current as unknown as SiteSettings;
      return {
        ...cur,
        copyrightHolder: text(s.copyrightHolder ?? cur.copyrightHolder, 80),
        donateUrl: url(s.donateUrl ?? cur.donateUrl) || cur.donateUrl,
        contact: { phone: text(s.contact?.phone ?? cur.contact.phone, 40), email: text(s.contact?.email ?? cur.contact.email, 120) },
        social: {
          x: url(s.social?.x),
          instagram: url(s.social?.instagram),
          youtube: url(s.social?.youtube),
          linkedin: url(s.social?.linkedin),
          facebook: url(s.social?.facebook),
        },
        mailingAddress: text(s.mailingAddress ?? (cur as { mailingAddress?: string }).mailingAddress, 200),
      };
    }
  }
}

export async function saveDoc(key: DocKey, value: Record<string, unknown>): Promise<Result> {
  try {
    const viewer = await assertStaff();
    const current = await readDoc<Record<string, unknown>>(key);
    // Merge so editors can send only the part they changed.
    await writeDoc(key, normalize(key, { ...current, ...value }, current), viewer.personId);
    return { ok: true, message: 'Saved.' };
  } catch (err) {
    return fail(err);
  }
}

export async function undoDoc(key: DocKey): Promise<Result> {
  try {
    const viewer = await assertStaff();
    return (await revertDoc(key, viewer.personId)) ? { ok: true, message: 'Previous version restored.' } : { ok: false, error: 'Nothing to undo.' };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
export async function saveTeamMember(id: string | null, form: FormData): Promise<Result> {
  try {
    await assertStaff();
    const db = serviceClient();
    const name = text(form.get('name'), 80);
    const role = text(form.get('role'), 80);
    if (!name || !role) return { ok: false, error: 'A name and a role are required.' };
    const email = text(form.get('email'), 120).toLowerCase();
    let photo: ImageRef | null = null;
    const file = form.get('image_file');
    if (file && typeof file === 'object' && file.size > 0) photo = await uploadImage(file, { folder: 'team', maxWidth: 1000, alt: name });
    else if (form.get('image_json')) photo = JSON.parse(String(form.get('image_json'))) as ImageRef;
    if (!photo) return { ok: false, error: 'Add a photo.' };
    photo = { ...photo, alt: name, focalX: Number(form.get('focal_x')) || 50, focalY: Number(form.get('focal_y')) || 50 };

    // Link the card to the person's record (by email) so leaving the team can grant honorary membership.
    let personId: string | null = null;
    if (email) {
      const rows = (await db.rpc('upsert_contact', { p_email: email, p_first: name.split(' ')[0], p_last: name.split(' ').slice(1).join(' '), p_source: 'admin', p_opt_in: 'none' })).data;
      personId = rows?.[0]?.person_id ?? null;
    }
    const fields = { name, role, email: email || null, photo: photo as unknown as NonNullable<Json>, x_url: url(form.get('x')) || null, linkedin_url: url(form.get('linkedin')) || null, person_id: personId };
    if (id) {
      const { error } = await db.from('team_members').update(fields).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const max = (await db.from('team_members').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()).data?.sort_order ?? 0;
      const { error } = await db.from('team_members').insert({ ...fields, sort_order: max + 1, started_on: new Date().toISOString().slice(0, 10) });
      if (error) throw new Error(error.message);
    }
    updateTag('team');
    return { ok: true, message: 'Saved.' };
  } catch (err) {
    return fail(err);
  }
}

/** Remove from the Team page. Kept on file — and past leaders become honorary members automatically. */
export async function setTeamMemberActive(id: string, active: boolean): Promise<Result> {
  try {
    await assertStaff();
    await serviceClient().from('team_members').update({ active, ended_on: active ? null : new Date().toISOString().slice(0, 10) }).eq('id', id);
    updateTag('team');
    return { ok: true, message: active ? 'Back on the Team page.' : 'Removed from the Team page — they’re now an honorary member.' };
  } catch (err) {
    return fail(err);
  }
}

export async function moveTeamMember(id: string, dir: -1 | 1): Promise<Result> {
  try {
    await assertStaff();
    const db = serviceClient();
    const rows = (await db.from('team_members').select('id, sort_order').eq('active', true).order('sort_order')).data ?? [];
    const i = rows.findIndex((r) => r.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return { ok: true };
    [rows[i], rows[j]] = [rows[j], rows[i]];
    await Promise.all(rows.map((r, n) => db.from('team_members').update({ sort_order: n }).eq('id', r.id)));
    updateTag('team');
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

// ---------------------------------------------------------------------------
// Banner photos
// ---------------------------------------------------------------------------
export async function addCollagePhotos(form: FormData): Promise<Result> {
  try {
    await assertStaff();
    const db = serviceClient();
    const files = form.getAll('photos').filter((f): f is File => typeof f === 'object' && f.size > 0);
    if (!files.length) return { ok: false, error: 'Choose one or more photos.' };
    // New photos go first, so they're placed prominently; existing ones shift down.
    const uploaded = [];
    for (const f of files) uploaded.push(await uploadImage(f, { folder: 'collage', maxWidth: 1600, grayscale: true }));
    const existing = (await db.from('collage_photos').select('id').order('sort_order')).data ?? [];
    await Promise.all(existing.map((r, n) => db.from('collage_photos').update({ sort_order: n + uploaded.length }).eq('id', r.id)));
    await db.from('collage_photos').insert(uploaded.map((u, n) => ({ src: u.src, width: u.width, height: u.height, sort_order: n })));
    await rebuildBanner();
    return { ok: true, message: `Added ${files.length} photo${files.length === 1 ? '' : 's'} and rebuilt the banner.` };
  } catch (err) {
    return fail(err);
  }
}

export async function updateCollagePhoto(id: string, patch: { emphasis?: number; focalX?: number; focalY?: number; remove?: boolean; move?: -1 | 1 }): Promise<Result> {
  try {
    await assertStaff();
    const db = serviceClient();
    if (patch.remove) {
      await db.from('collage_photos').delete().eq('id', id);
    } else if (patch.move) {
      const rows = (await db.from('collage_photos').select('id').order('sort_order')).data ?? [];
      const i = rows.findIndex((r) => r.id === id);
      const j = i + patch.move;
      if (i >= 0 && j >= 0 && j < rows.length) {
        [rows[i], rows[j]] = [rows[j], rows[i]];
        await Promise.all(rows.map((r, n) => db.from('collage_photos').update({ sort_order: n }).eq('id', r.id)));
      }
    } else {
      await db
        .from('collage_photos')
        .update({
          ...(patch.emphasis !== undefined ? { emphasis: Math.min(3, Math.max(0.5, patch.emphasis)) } : {}),
          ...(patch.focalX !== undefined ? { focal_x: patch.focalX, focal_y: patch.focalY ?? 50 } : {}),
        })
        .eq('id', id);
    }
    await rebuildBanner();
    return { ok: true, message: 'Banner rebuilt.' };
  } catch (err) {
    return fail(err);
  }
}
