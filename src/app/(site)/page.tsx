import Image from 'next/image';
import { AnnouncementCard, type CardEvent } from '@/components/home/AnnouncementCard';
import { HeroBanner } from '@/components/home/HeroBanner';
import { MailingListForm } from '@/components/forms/MailingListForm';
import { blurOf, getCollageBanner, getEventTimeline, getHome } from '@/lib/content/repo';
import { formatCardDate } from '@/lib/dates';

/** Wrap the first word of the essay in the red drop cap ("The"). */
function withDropCap(html: string) {
  return html.replace(/^<p>(\s*)([^\s<]+)/, '<p>$1<span class="dropcap">$2</span>');
}

export default async function HomePage() {
  const [home, banner, timeline] = await Promise.all([getHome(), getCollageBanner(), getEventTimeline()]);

  const cardEvents: CardEvent[] = timeline.featured.map((e) => ({
    slug: e.slug,
    title: e.homeCard?.title ?? e.title,
    subtitle: e.homeCard?.subtitle,
    dateLabel: formatCardDate(e.startsAt),
    endsAt: e.endsAt,
  }));

  const stripBlur = blurOf('/media/site/photo-strip.jpg');

  return (
    <div className="page">
      <HeroBanner banner={banner}>
        <AnnouncementCard events={cardEvents} fallback={home.fallbackCard} />
      </HeroBanner>

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
        <Image
          src="/media/site/photo-strip.jpg"
          alt=""
          fill
          sizes="100vw"
          {...(stripBlur ? { placeholder: 'blur' as const, blurDataURL: stripBlur } : {})}
        />
      </div>

      <MailingListForm />
    </div>
  );
}
