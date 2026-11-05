// Break-glass access. Addresses in the ADMIN_EMAILS setting (kept in the
// hosting dashboard, not in the database) are always admins: signing in with
// one restores admin access even if every officer was removed in the app.
// Put the society's permanent account here (see docs/OPERATIONS.md).
import 'server-only';
import { hasDatabase, serviceClient } from '@/lib/supabase/clients';

/** ADMIN_EMAILS: people separated by ";", one person's addresses by ",". */
export function ownerEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(/[;,]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Call right after a successful sign-in with an address the sign-in proved. */
export async function ensureOwnerAccess(userId: string, email: string | undefined): Promise<void> {
  if (!email || !hasDatabase() || !ownerEmails().has(email.toLowerCase())) return;
  const db = serviceClient();
  const link = (await db.from('auth_links').select('person_id').eq('user_id', userId).maybeSingle()).data;
  if (!link) return;
  const { error } = await db.from('staff').upsert({ person_id: link.person_id, role: 'admin' });
  if (error) console.error('Could not restore owner access', error.message);
}
