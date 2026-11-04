// The one-tap link in the sign-in email.
import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/auth/viewer';
import { sessionClient } from '@/lib/supabase/ssr';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const next = safeNext(url.searchParams.get('next'));
  if (tokenHash) {
    const supabase = await sessionClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=link', url.origin));
}
