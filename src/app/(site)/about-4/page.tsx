import type { Metadata } from 'next';
import { ContactForm } from '@/components/forms/ContactForm';
import { Ornament, ORNAMENT_BY_CHAR } from '@/components/Ornament';
import { RichText } from '@/components/RichText';
import { SocialLinks } from '@/components/SocialLinks';
import { getMission, getSettings } from '@/lib/content/repo';

export const metadata: Metadata = { title: 'MISSION' };

function SectionOrnament({ char, color }: { char: string; color: 'gold' | 'red' }) {
  const name = ORNAMENT_BY_CHAR[char];
  return name ? <Ornament name={name} className={`orn-${color}`} /> : null;
}

export default async function MissionPage() {
  const [mission, settings] = await Promise.all([getMission(), getSettings()]);
  const c = mission.contactSection;
  return (
    <div className="page">
      <header className="mission-head">
        <div className="mission-head__box">
          <Ornament name="flourish" />
          <h1>{mission.title}</h1>
          <Ornament name="flourish" />
        </div>
      </header>

      {mission.sections.map((s) => (
        <section key={s.id} id={s.id} className={`mission-section theme-${s.theme}`}>
          <div className="mission-section__inner">
            <h2>
              <SectionOrnament char={s.ornament} color={s.ornamentColor} />
              {s.heading}
            </h2>
            <RichText html={s.body} />
          </div>
        </section>
      ))}

      <section className={`mission-section mission-contact theme-${c.theme}`} id="further-questions">
        <div className="mission-section__inner">
          <h2>
            <SectionOrnament char={c.ornament} color="gold" />
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
