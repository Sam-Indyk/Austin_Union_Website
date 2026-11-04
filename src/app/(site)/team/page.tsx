import type { Metadata } from 'next';
import Image from 'next/image';
import { CircleBadge, LinkedInIcon, XIcon } from '@/components/icons';
import { Ornament } from '@/components/Ornament';
import { RichText } from '@/components/RichText';
import { getTeam } from '@/lib/content/repo';

export const metadata: Metadata = { title: 'TEAM' };

export default async function TeamPage() {
  const team = await getTeam();
  return (
    <div className="team-page">
      <header className="team-head">
        <h1>{team.title}</h1>
        <p className="team-head__motto">
          <Ornament name="scroll" />
          {team.motto}
          <Ornament name="scroll" className="ornament--flip" />
        </p>
      </header>
      <RichText html={team.intro} className="team-intro" />
      <ul className="team-grid">
        {team.members.map((m, i) => (
          <li key={m.id} className="member">
            <div className="member__photo">
              <Image
                src={m.photo.src}
                alt={m.photo.alt}
                fill
                sizes="(max-width: 760px) 100vw, 344px"
                loading={i < 2 ? 'eager' : 'lazy'}
                {...(m.photo.blurDataURL ? { placeholder: 'blur' as const, blurDataURL: m.photo.blurDataURL } : {})}
                style={{ objectPosition: `${m.photo.focalX ?? 50}% ${m.photo.focalY ?? 50}%` }}
              />
            </div>
            <div className="member__body">
              <p className="member__role">{m.role}</p>
              <p className="member__name">{m.name}</p>
              {m.email && (
                <a className="member__email" href={`mailto:${m.email}`}>
                  {m.email}
                </a>
              )}
              {(m.x || m.linkedin) && (
                <ul className="social">
                  {m.x && (
                    <li>
                      <a href={m.x} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on X`}>
                        <CircleBadge icon={XIcon} />
                      </a>
                    </li>
                  )}
                  {m.linkedin && (
                    <li>
                      <a href={m.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn`}>
                        <CircleBadge icon={LinkedInIcon} />
                      </a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
