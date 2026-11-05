import Image from 'next/image';
import { AnnouncementCard, type CardEvent } from '@/components/home/AnnouncementCard';
import { HeroBanner } from '@/components/home/HeroBanner';
import { MailingListForm } from '@/components/forms/MailingListForm';
import { blurOf, getCollageBanner, getEventTimeline, getFeaturedVote, getHome } from '@/lib/content/repo';
import Link from 'next/link';
import { formatCardDate } from '@/lib/dates';

/** Wrap the first word of the essay in the red drop cap ("The"). */
function withDropCap(html: string) {
  return html.replace(/^<p>(\s*)([^\s<]+)/, '<p>$1<span class="dropcap">$2</span>');
}

export default async function HomePage() {
  const [home, banner, timeline, liveVote] = await Promise.all([getHome(), getCollageBanner(), getEventTimeline(), getFeaturedVote()]);

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
      {liveVote && (
        <Link href={`/vote/${liveVote.slug}`} className="vote-ribbon">
          <span className="vote-ribbon__live">
            <i className="phase__dot" /> {liveVote.phase === 'initial_closed' ? 'Vote in progress' : 'Live vote'}
          </span>
          <span className="vote-ribbon__q">{liveVote.resolution}</span>
          <span className="vote-ribbon__cta">{liveVote.phase === 'initial_closed' ? 'See results →' : 'Cast your vote →'}</span>
        </Link>
      )}
      <HeroBanner banner={banner}>
        <AnnouncementCard events={cardEvents} fallback={home.fallbackCard} />
      </HeroBanner>

      <section className="essay-section">
        <div className="container">
          <div className="epigraph" data-edit="home:epigraph" data-edit-label="Opening lines">
            {home.epigraph.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="essay" data-edit="home:essay" data-edit-label="Homepage essay" dangerouslySetInnerHTML={{ __html: withDropCap(home.essay.join('')) }} />
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
