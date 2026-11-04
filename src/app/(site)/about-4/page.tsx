import type { Metadata } from 'next';
import { ContactForm } from '@/components/forms/ContactForm';
import { RichText } from '@/components/RichText';
import { SocialLinks } from '@/components/SocialLinks';
import { getMission, getSettings } from '@/lib/content/repo';

export const metadata: Metadata = { title: 'MISSION' };

export default async function MissionPage() {
  const [mission, settings] = await Promise.all([getMission(), getSettings()]);
  const c = mission.contactSection;
  return (
    <div className="page">
      <header className="mission-head">
        <div className="mission-head__box">
          <span className="ornament" aria-hidden="true">
            k
          </span>
          <h1>{mission.title}</h1>
          <span className="ornament" aria-hidden="true">
            k
          </span>
        </div>
      </header>

      {mission.sections.map((s) => (
        <section key={s.id} id={s.id} className={`mission-section theme-${s.theme}`}>
          <div className="mission-section__inner">
            <h2>
              <span className={`ornament orn-${s.ornamentColor}`} aria-hidden="true">
                {s.ornament}
              </span>
              {s.heading}
            </h2>
            <RichText html={s.body} />
          </div>
        </section>
      ))}

      <section className={`mission-section mission-contact theme-${c.theme}`} id="further-questions">
        <div className="mission-section__inner">
          <h2>
            <span className="ornament orn-gold" aria-hidden="true">
              {c.ornament}
            </span>
            {c.heading}
          </h2>
          <p className="mission-contact__intro">{c.intro}</p>
          <SocialLinks links={settings.social} />
          <ContactForm variant="mission" page="/about-4" />
        </div>
      </section>
    </div>
  );
}
