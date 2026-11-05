import type { Metadata } from 'next';
import { getDonate, getSettings } from '@/lib/content/repo';

export const metadata: Metadata = { title: 'DONATE' };

export default async function DonatePage() {
  const [donate, settings] = await Promise.all([getDonate(), getSettings()]);
  return (
    <div className="donate-page" data-edit="donate" data-edit-label="Donate page">
      <h1>{donate.title}</h1>
      <div className="rich" dangerouslySetInnerHTML={{ __html: donate.body.join('') }} />
      <a className="donate-btn" href={settings.donateUrl} target="_blank" rel="noopener noreferrer">
        {donate.buttonLabel}
      </a>
    </div>
  );
}
