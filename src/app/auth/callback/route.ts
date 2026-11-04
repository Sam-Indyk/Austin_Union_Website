// Google sign-in lands here with a one-time code, which becomes the session.
import { NextResponse, type NextRequest } from 'next/server';
import { safeNext } from '@/lib/auth/viewer';
import { sessionClient } from '@/lib/supabase/ssr';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  if (code) {
    const supabase = await sessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL(`/login?error=google&next=${encodeURIComponent(next)}`, url.origin));
}
