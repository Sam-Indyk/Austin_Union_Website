import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { Ornament } from '@/components/Ornament';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'LOGIN', robots: { index: false } };

const ERRORS: Record<string, string> = {
  google: 'Google sign-in didn’t complete. Please try again, or use an email code.',
  link: 'That sign-in link has expired or was already used. Enter your email to get a new code.',
};

async function Panel({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const sp = await searchParams;
  const next = typeof sp.next === 'string' ? sp.next : '/account';
  const error = typeof sp.error === 'string' ? ERRORS[sp.error] : undefined;
  return <LoginForm next={next} initialError={error} googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_SIGNIN === 'on'} />;
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <div className="paper">
      <div className="paper__inner paper__inner--narrow">
        <header className="masthead">
          <Image className="masthead__seal" src="/media/site/seal.png" alt="" width={96} height={96} preload />
          <h1>Member Login</h1>
          <p className="masthead__motto">
            <Ornament name="scroll" />
            Veritas per disputandem
            <Ornament name="scroll" className="ornament--flip" />
          </p>
        </header>
        <div className="frame">
          <div className="frame__inner">
            <Suspense fallback={<div style={{ minHeight: 260 }} />}>
              <Panel searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
        <p className="prose small" style={{ textAlign: 'center', marginTop: 22 }}>
          Members, officers and guests can all sign in. New here? Signing in creates your account.
        </p>
      </div>
    </div>
  );
}
