import Image from 'next/image';
import { AnnouncementCard, type CardEvent } from '@/components/home/AnnouncementCard';
import { HeroCollage } from '@/components/home/HeroCollage';
import { MailingListForm } from '@/components/forms/MailingListForm';
import { getCollage, getEventTimeline, getHome } from '@/lib/content/repo';
import { formatCardDate } from '@/lib/dates';

/** Wrap the first word of the essay in the red drop cap ("The"). */
function withDropCap(html: string) {
  return html.replace(/^<p>(\s*)([^\s<]+)/, '<p>$1<span class="dropcap">$2</span>');
}

export default async function HomePage() {
  const [home, collage, timeline] = await Promise.all([getHome(), getCollage(), getEventTimeline()]);

  const cardEvents: CardEvent[] = timeline.featured.map((e) => ({
    slug: e.slug,
    title: e.homeCard?.title ?? e.title,
    subtitle: e.homeCard?.subtitle,
    dateLabel: formatCardDate(e.startsAt),
    endsAt: e.endsAt,
  }));

  return (
    <div className="page">
      <HeroCollage photos={collage}>
        <AnnouncementCard events={cardEvents} fallback={home.fallbackCard} />
      </HeroCollage>

      <section className="essay-section">
        <div className="container">
          <div className="epigraph">
            {home.epigraph.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="essay" dangerouslySetInnerHTML={{ __html: withDropCap(home.essay.join('')) }} />
          <div className="essay-divider">
            <Image src="/media/site/seal.png" alt="Austin Union Society seal" width={212} height={212} />
          </div>
        </div>
      </section>

      <div className="photo-strip">
        <Image src="/media/site/photo-strip.jpg" alt="" fill sizes="100vw" />
      </div>

      <MailingListForm />
    </div>
  );
}
