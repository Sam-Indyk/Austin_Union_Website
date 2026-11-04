import type { SocialLinks as Links } from '@/lib/content/types';
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon, YouTubeIcon } from './icons';

const ORDER = [
  ['x', 'X', XIcon],
  ['instagram', 'Instagram', InstagramIcon],
  ['youtube', 'YouTube', YouTubeIcon],
  ['linkedin', 'LinkedIn', LinkedInIcon],
  ['facebook', 'Facebook', FacebookIcon],
] as const;

/** Renders only the networks that have a URL configured. */
export function SocialLinks({ links, className }: { links: Links; className?: string }) {
  const items = ORDER.filter(([key]) => links[key]);
  if (items.length === 0) return null;
  return (
    <ul className={['social', className].filter(Boolean).join(' ')}>
      {items.map(([key, label, Icon]) => (
        <li key={key}>
          <a href={links[key]} target="_blank" rel="noopener noreferrer" aria-label={`Austin Union on ${label}`}>
            <Icon />
          </a>
        </li>
      ))}
    </ul>
  );
}
