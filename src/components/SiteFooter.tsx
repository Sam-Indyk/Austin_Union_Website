import { cacheLife } from 'next/cache';
import { getSettings } from '@/lib/content/repo';
import { SocialLinks } from './SocialLinks';

async function currentYear() {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const [settings, year] = await Promise.all([getSettings(), currentYear()]);
  return (
    <footer className="site-footer">
      <p className="site-footer__copy">
        All images and content © {year} {settings.copyrightHolder}. ALL RIGHTS RESERVED.
      </p>
      <SocialLinks links={settings.social} />
    </footer>
  );
}
