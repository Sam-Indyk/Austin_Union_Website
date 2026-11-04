// Initial content, transcribed from the Wix site (austinunion.org) on 2026-11-03.
// This seeds the database; once Supabase is connected, edits happen in the admin.
import type {
  CollagePhoto,
  ContactContent,
  DonateContent,
  EventItem,
  HomeContent,
  MissionContent,
  SiteSettings,
  TeamContent,
} from './types';
import collageTiles from './collage-seed.json';

export const settings: SiteSettings = {
  siteName: 'Austin Union',
  copyrightHolder: 'AUSTIN UNION',
  social: {
    x: 'https://x.com/austin_union',
    instagram: 'https://www.instagram.com/austinunionsociety/',
    youtube: 'https://www.youtube.com/@AustinUnionSociety',
    // The Wix footer linked to Wix's own LinkedIn page; left blank until we have the real one.
    linkedin: '',
  },
  donateUrl: 'https://donate.stripe.com/dRm3cw85ugkugv698K48000',
  contact: { phone: '781-541-0956', email: 'sam@austinunion.org' },
  timezone: 'America/Chicago',
};

export const home: HomeContent = {
  epigraph: ['In a world where lies are bought and sold,', 'Truth commands the highest price.'],
  essay: [
    '<p>The urgency of today’s crises have swelled to a fever pitch - American education is shipwrecked, geopolitical tensions cross red lines, and existential questions about technology threaten humanity with either paradise or purgatory. Yet despite all the hand-wringing over ‘polarization,’ little headway has been made in improving the discourse surrounding these issues.</p>',
    '<p>That’s why we started the Austin Union.</p>',
    '<p>The great images of the past have recognized the vital importance of debate; whether it is Jacob wrestling with the angels of God, the heroes of Homer defying divine decree, or the American legacy of critical change through fearless speech - the spirit of adversarial dialogue has been etched into the foundations of our civilization.</p>',
    '<p>But it is precisely this spirit which is missing in our decisive moment. Today, debate has been relegated to the Twitter warriors, or the comment sections of YouTube videos. Presidential debates are spliced into distorted 15-second clips, allowing politicians to continue talking past each other on platforms abandoned by their detractors. The alternative, long-form podcasting, has left us drowning in a sea of noise and slog. Guests never face down their opposition, and listeners don’t have the bandwidth to digest four hours of meandering conversation.</p>',
    '<p>Our moment demands something better.</p>',
    '<p>The Austin Union Society offers just that - a new forum, fortified in the old ways. We believe the truth is out there, that it is vital and urgent. But the way we reach it is not through slow speech and distorted dialogue.</p>',
    '<p>We believe in truth through debate.</p>',
    '<p>Entirely student run, we are charged with the ambition and frustration of a generation which cannot accept the conditions of contemporary conversation. The pillars of democracy stand upon the foundation of good debate. Ferocity, conviction, and a ruthless commitment to the truth are the basis of our Western civilization. We don’t have to agree on the solutions to our many crises - but we do have to agree they are worth fighting over. The Austin Union Society is the platform for that good fight.</p>',
    '<p>If it is crucial - bring it to the Union. If it counts for something - debate it with us. If the time to act is now - -</p>',
    '<p>Fight with us. Join the Austin Union.</p>',
  ],
  fallbackCard: {
    title: 'Veritas per disputandem',
    subtitle: 'New events are announced here first.',
    linkLabel: 'JOIN THE LIST',
    linkHref: '#mailing-list',
  },
};

export const mission: MissionContent = {
  title: 'Our Mission',
  sections: [
    {
      id: 'truth-through-debate',
      heading: "Why 'Truth through Debate?'",
      ornament: 'x',
      ornamentColor: 'gold',
      theme: 'red',
      body:
        "<p>Why debate? Or why bother with the truth at all? It's already a cliche: in an era where information overloads categories, and self-evident 'truths' fracture along individual or party-lines, the only question left to ask seems to be, 'whose truth?'</p>" +
        "<p>The Austin Union does not make a claim to possess 'the Truth,' with a capital-T; rather, we believe that debate -- the adversarial dialectic - - is one of the sure ways to stake it out. Our membership is composed of diverse ontological persuasion; still, we share a conviction that debate, in its myriad forms, harbors a real and unmatched vital power in investigating general and specific truths. While the fine strands of the big picture might always exceed us, debate will always bring us closer to apprehending the whole.</p>" +
        '<p>Thus, we strive toward a <em>culture</em> of debate, and a <em>method</em> of truth. In this way, we aspire to sit someplace in-between epistemology and application, recognizing the inextricable bond between the two, and the responsibility of the earnest actor to mediate between them. You might walk away from one of our events with either a changed mind, or an emboldened belief; regardless, you will have shared in an active process which deepens our engagement with the world and each-other.</p>',
    },
    {
      id: 'why-not-oxford',
      heading: 'Why not Oxford?',
      ornament: 'W',
      ornamentColor: 'red',
      theme: 'cream',
      body:
        "<p>Perhaps the better question is, 'Why Austin?' The Oxford Union has established a legacy of fearless inquiry stretching back over 200 years, being founded under the threat of legal and academic discipline. We consider ourselves honored to share in this tradition, bringing forward the many lights of free speech into the present conversation.</p>" +
        '<p>The center stage has shifted, though, and we recognize the emergence of a similar landscape which made the Oxford Union necessary. Speech today is besieged on many fronts; technological, political, or otherwise. You might harbor the boldest opinions, but our social infrastructure ensures they will never be faced down. Whether in the digital town-square, or on the standard college campus -- the feedback loop prevails.</p>',
    },
    {
      id: 'renewed-vision',
      heading: 'A Renewed Vision',
      ornament: '&',
      ornamentColor: 'gold',
      theme: 'maroon',
      body:
        '<p>We aim to break this destructive cycle, and reassert the institution of debate as a higher way. To catch flame in the modern era, however, we are bringing the conversation into the eye of the storm: Austin. The spirit of innovation must be brought to our schools of debate, leading us beyond parliamentary exercises; likewise, the unbounded progress of our age must be tempered by careful and cogent conversation.</p>' +
        "<p>We're not kidding ourselves -- establishing a debate society with ambitions to 'take back the zeitgeist' is an underdog's gambit, to be blunt.</p>",
    },
    {
      id: 'brass-tacks',
      heading: 'Brass Tacks',
      ornament: '(',
      ornamentColor: 'red',
      theme: 'charcoal',
      body: '<p>Lofty ambitions aside -- what does a debate society actually do? And what has the Austin Union actually done?</p>',
    },
  ],
  contactSection: {
    heading: 'Further questions?',
    ornament: '4',
    intro: 'Get in touch so we can start working together.',
    theme: 'red',
  },
};

export const team: TeamContent = {
  title: 'Our Team',
  motto: 'Veritas per disputandem',
  intro:
    '<p>The Austin Union is entirely student run. Our leadership team is comprised of elected representatives from the University of Austin student body, a fiercely competitive demographic which ensures only the highest commitment to the good governance of the Society.</p>',
  // Social links on the Wix team page pointed at template placeholders (Wix's own accounts,
  // and two unrelated people). They are left empty until members supply their own.
  members: [
    { id: 'samuel-indyk', name: 'Samuel Indyk', role: 'President', email: 'sam@austinunion.org', photo: { src: '/media/team/samuel-indyk.jpg', alt: 'Samuel Indyk', focalX: 50, focalY: 34 } },
    { id: 'merrick-meardon', name: 'Merrick Meardon', role: 'Vice President', email: 'merrick@austinunion.org', photo: { src: '/media/team/merrick-meardon.jpg', alt: 'Merrick Meardon' } },
    { id: 'eitan-zarin', name: 'Eitan Zarin', role: 'Treasurer', email: 'eitan@austinunion.org', photo: { src: '/media/team/eitan-zarin.jpg', alt: 'Eitan Zarin' } },
    { id: 'francesca-naugle', name: 'Francesca Naugle', role: 'Prefect', email: 'francesca@austinunion.org', photo: { src: '/media/team/francesca-naugle.jpg', alt: 'Francesca Naugle', focalX: 35, focalY: 50 } },
    { id: 'luke-bradley', name: 'Luke Bradley', role: 'Parliamentarian', email: 'luke@austinunion.org', photo: { src: '/media/team/luke-bradley.jpg', alt: 'Luke Bradley' } },
    { id: 'analina-naugle', name: 'Analina Naugle', role: 'Events Coordinator', email: 'analina@austinunion.org', photo: { src: '/media/team/analina-naugle.jpg', alt: 'Analina Naugle' } },
    { id: 'benjamin-fortinsky', name: 'Benjamin Fortinsky', role: 'Ambassador', email: 'benjamin@austinunion.org', photo: { src: '/media/team/benjamin-fortinsky.jpg', alt: 'Benjamin Fortinsky' } },
  ],
};

export const donate: DonateContent = {
  title: 'Support Our Mission',
  body: [
    "<p>The Union's success in advancing free speech and open inquiry is dependent on the generosity of our donors and partners. Your support is more than financial: it represents a vote of confidence in the power of debate to impact public discourse.</p>",
    '<p>If you would like sponsor or arrange a debate, please reach out via the "Contact" page.</p>',
  ],
  buttonLabel: 'Donate',
};

export const contact: ContactContent = {
  title: 'Contact',
  intro: "For more information, please don't hesitate to contact us.",
  formHeading: "Let's Chat",
};

export const collage: CollagePhoto[] = collageTiles.map((t, i) => ({ id: `seed-${i}`, ...t }));

const img = (slug: string, alt: string, focalY = 50) => ({ src: `/media/events/${slug}.jpg`, alt, focalX: 50, focalY });
const recapPhoto = (name: string) => ({ src: `/media/events/${name}.jpg`, alt: '' });

// Times are the wall-clock times Wix displayed, in Austin (Central) time.
export const events: EventItem[] = [
  {
    id: 'evt-public-speaking-crash-course',
    slug: 'public-speaking-crash-course',
    status: 'published',
    title: 'Public Speaking Crash Course',
    summary: 'Members of the Austin Union Society join Curt Steinhorst for a course designed to hone their speech and debate skills.',
    description:
      '<p>We are only as smart as we communicate. Curt Steinhorst will help Austin Union members hone their communication skills, assisting in the pursuit of truth through debate.</p>',
    startsAt: '2026-11-05T18:00:00-06:00',
    endsAt: '2026-11-05T20:00:00-06:00',
    locationName: 'Private Location',
    image: img('public-speaking-crash-course', 'Public Speaking Crash Course', 0),
    rsvp: { mode: 'native' },
    featureOnHome: true,
    homeCard: { subtitle: 'A Workshop with Curt Steinhorst' },
  },
  {
    id: 'evt-jonathan-pageau',
    slug: 'jonathan-pageau-ai-and-transhumanism',
    status: 'published',
    title: 'Jonathan Pageau: AI and Transhumanism',
    summary: 'What does it mean to be truly human when the technology to enhance human biology and cognition is available and advancing?',
    description:
      '<p>Doors open at 5:00 pm for mingling.</p><p>Seated by 5:30 pm for speaker and Q&amp;A.</p><p></p><p><strong>RSVP HERE: </strong><a href="https://uaustin.swoogo.com/Jonathan-Pageau"><strong>https://uaustin.swoogo.com/Jonathan-Pageau</strong></a></p><p></p><p>We look foward to seeing you there!</p>',
    startsAt: '2026-10-06T17:30:00-05:00',
    endsAt: '2026-10-06T19:00:00-05:00',
    locationName: 'UATX campus',
    address: '522 Congress Ave #200, Austin, TX 78701, USA',
    image: img('jonathan-pageau-ai-and-transhumanism', 'Jonathan Pageau: AI and Transhumanism'),
    rsvp: { mode: 'native', partner: { kind: 'swoogo', url: 'https://uaustin.swoogo.com/Jonathan-Pageau' } },
    featureOnHome: true,
  },
  {
    id: 'evt-political-violence',
    slug: 'open-forum-is-political-violence-ever-justified',
    status: 'published',
    title: 'Open Forum: Is Political Violence Ever Justified?',
    summary:
      'From the sweeping tides of historical revolutions to targeted assassination, political violence fundamentally challenges our attitudes toward what it takes to achieve true progress. Do you justify or condemn political violence? By what standard?',
    description:
      "<p>Our first 'Open Forum' debate of the 26-27' season will take place on <strong>Sunday,</strong> <strong>September 27th </strong>at 6:00pm, under the resolution: <strong>“Is Political Violence ever Justified?” </strong>Dinner will be served at 6:00pm, with debate starting promptly at 6:30pm. Doors will close at 6:45pm. Drinks will be served throughout the night.</p><p></p><p><strong>Formal dress and RSVP registration are required for event entry.</strong></p><p></p><p>Image Source: The Battle of Grunwald (1878) by Jan Matejko, courtesy of the National Museum in Warsaw / Public Domain.</p>",
    startsAt: '2026-09-27T18:00:00-05:00',
    endsAt: '2026-09-27T21:00:00-05:00',
    locationName: 'Location available upon RSVP.',
    image: img('open-forum-is-political-violence-ever-justified', 'Open Forum: Is Political Violence Ever Justified?'),
    rsvp: { mode: 'native' },
    featureOnHome: true,
  },
  {
    id: 'evt-still-a-republic',
    slug: 'open-forum-is-america-still-a-republic',
    status: 'published',
    title: 'Open Forum: Is America Still a Republic?',
    summary:
      "As we approach our nation's 250th birthday, the question beckons: Do our founding ideals survive into today? And if not -- should we welcome new orders, or aspire back toward our original past?\n\nCome raise your voice at our final Open Forum of the season.",
    description:
      "<p>Our final 'Open Forum' debate of the 25-26' season will take place on <strong>Friday,</strong> <strong>May 22nd</strong> at 6:00pm, under the resolution: <strong>“Is America Still a Republic?” </strong>Dinner will be served at 6:00pm, with debate starting promptly at 6:30pm. Doors will close at 6:45pm. Drinks will be served throughout the night.</p><p></p><p><strong>Formal dress and RSVP registration are required for event entry.</strong></p><p></p><p>Image: <em>Aspiration, </em><a href=\"https://www.arthistoryproject.com/artists/aaron-douglas/aspiration/\">Aaron Douglas</a>, 1936</p>",
    startsAt: '2026-05-22T18:00:00-05:00',
    endsAt: '2026-05-22T21:30:00-05:00',
    locationName: 'Location available upon RSVP.',
    image: img('open-forum-is-america-still-a-republic', 'Open Forum: Is America Still a Republic?'),
    rsvp: { mode: 'native' },
    featureOnHome: true,
  },
  {
    id: 'evt-urbanization',
    slug: 'open-forum-does-urbanization-promote-human-flourishing',
    status: 'published',
    title: 'Open Forum: Does Urbanization Promote Human Flourishing?',
    summary:
      'Rapid technological and economic innovations have shifted civilization away from rural, agricultural societies into metropolises of trade and industry.  Does this urbanization ultimately promote human life, or harm it? Contribute to the conversation at the Austin Union.',
    description:
      '<p>On <strong>Monday, March 2, at 6:00pm</strong>, the Austin Union will be hosting an Open Forum debate discussing: <strong>"Does Urbanization Promote Human Flourishing?" </strong>Dinner will be served at 6:00pm, and the debate will be started promptly at 6:30pm. Drinks will be served throughout the night.</p><p></p><p>Kindly note that<strong> formal dress and RSVP are required for event entry.</strong></p><p></p><p>Since the dawn of the Industrial Revolution, civilization has shifted from rural, agricultural communities towards large centers of trade and industry. The economic, cultural, and sociological ramifications of this change are significant, and we must ask: is modern urbanization conducive to human flourishing? If not, what is the best way of living to achieve this? What qualities should we value most in a society? This debate prompts each of us to consider the effects of modern societal life on human happiness. Contribute to the discussion at the Austin Union.</p><p></p><p>Image: <em>The City From Greenwich Village,</em> <a href="https://www.nga.gov/artists/1881-john-sloan">John Sloan</a>, 1922</p>',
    startsAt: '2026-03-02T18:00:00-06:00',
    endsAt: '2026-03-02T21:00:00-06:00',
    locationName: 'The Mansion',
    address: '2312 San Gabriel St, Austin, TX 78705, USA',
    image: img('open-forum-does-urbanization-promote-human-flourishing', 'Open Forum: Does Urbanization Promote Human Flourishing?'),
    rsvp: { mode: 'native' },
    featureOnHome: true,
  },
  {
    id: 'evt-christian-nation',
    slug: 'open-forum-is-america-a-christian-nation',
    status: 'published',
    title: 'Open Forum: Is America a Christian Nation?',
    summary:
      'Since its founding, America has been haunted by two fundamental questions: What drives the nation forward? And what holds it together?\n\nWas Christianity, as its creed or culture, essential to its early success? And is it still relevant today? Speak your mind at the Austin Union.',
    description:
      "<p>Our kickoff 'Open Forum' debate will take place at the Mansion on 2312 San Gabriel St, Austin, TX 78705 on <strong>Monday,</strong> <strong>February 9th</strong> at 6:00pm, under the resolution: <strong>“Is America a Christian Nation?” </strong>Dinner will be served at 6:00pm, with debate starting promptly at 6:30pm. Doors will close at 6:45pm. Drinks will be served throughout the night.</p><p></p><p><strong>Formal dress and RSVP registration are required for event entry.</strong><br><br>Religion and politics: what else is there to discuss? Today, America's cultural and religious makeup is anything but uniform; but do its laws, customs, and aspirations remain essentially Christian? Or has the Nation lost its original character? Or was America, in its ancient and modern roots, even founded upon the faith? Monday's resolution begs deep questions concerning our past, in its examination of our present and future days.</p><p></p><p>Image: <em>Penn's Treaty with the Indians</em>, <a href=\"https://www.arthistoryproject.com/artists/edward-hicks/\">Edward Hicks</a>, 1830 – 1840</p>",
    startsAt: '2026-02-09T18:00:00-06:00',
    endsAt: '2026-02-09T21:00:00-06:00',
    locationName: 'The Mansion',
    address: '2312 San Gabriel St, Austin, TX 78705, USA',
    image: img('open-forum-is-america-a-christian-nation', 'Open Forum: Is America a Christian Nation?'),
    rsvp: { mode: 'native' },
    featureOnHome: true,
  },
  {
    id: 'evt-beyond-athens',
    slug: 'beyond-athens-and-jerusalem-by-william-posey',
    status: 'published',
    title: "'Beyond Athens and Jerusalem' by William Posey",
    summary: 'Austin Union member William Posey addresses the house with a provocative lecture,  urging for the formation of a new identity for the West.',
    description:
      "<p>Doors open at 3:45pm, followed by a cocktail hour. The address will begin promptly at 4:30, and will be succeeded by a 25 minute cross-examination period, consisting of a series of five-minute segments with pre-selected members. After this time, Mr. Posey will take questions from the house for 10 minutes.</p><p></p><p>Mr. Posey's abstract is as follows:</p><p></p><p>\"The view that the West exists as a synthetic tension between the two poles of Greek and Jewish Civilization is ahistorical. It confines both the Greek and Jewish traditions to a one-dimensional axis of Reason contra Revelation, and precludes the possibility of Western Civilization being interpreted independently of this paradigm. Instead of being understood relative to a shared spectrum of epistemology, each of these three civilizations should be understood as organically-developing wholes independent of each other. Classical Greek Civilization is centered upon the concept of the ‘body’, or soma, and resultantly views the world through the lens of the immanent and the physical. Jewish Civilization developed alongside other Near Eastern faiths like Zoroastrianism, Eastern Christianity, Manicheanism, and Islam, all of which have as their foundation the idea of God’s mysterious and limited self-disclosure through the numinous veil of his transcendence—in others words, the world is symbolically a cavern suffused by divinity. Western Civilization springs from the concept of the infinite, and thus approaches the world in terms of universality and expansion. Each of these three central animating concepts—the body, the cave, and the infinite—condition the way in which their respective civilizations express themselves, whether through their arts, their sciences, their philosophies, their politics, or their religions.</p><p></p><p>Over the course of my lecture, I will advance and develop the idea that these three civilizations are best understood as holistic, organic expressions of a core principle unique to each of them, in contrast to the idea that the Greek and Jewish Civilizations are diametric opposites defined by the irreconcilability of their competing epistemologies, and that Western Civilization unfolds from its perpetual effort to bind the Reason of Athens to the Revelation of Jerusalem.\"</p>",
    startsAt: '2025-11-05T16:00:00-06:00',
    endsAt: '2025-11-05T18:00:00-06:00',
    locationName: 'Private Location',
    image: img('beyond-athens-and-jerusalem-by-william-posey', "'Beyond Athens and Jerusalem' by William Posey"),
    rsvp: { mode: 'native' },
    featureOnHome: true,
  },
  {
    id: 'evt-weekend-crash-course',
    slug: 'weekend-crash-course',
    status: 'published',
    title: 'Weekend Crash Course',
    summary: 'Matriculated members of the Austin Union Society join Guest Coaches for a weekend intensive designed to hone their skills as debaters.',
    description:
      '<p>Members will attend a series of workshops centered around key debate skills: 1) Rhetoric &amp; Presentation, 2) Weaving Evidence, and 3) Rebuttals &amp; Questioning. During the lunch our, members will have the chance to watch a debate between two of the coaches, observing how the aforementioned skills interact in context.</p>',
    startsAt: '2025-10-18T10:00:00-05:00',
    endsAt: '2025-10-18T16:00:00-05:00',
    locationName: 'Private Location',
    image: img('weekend-crash-course', 'Weekend Crash Course'),
    rsvp: { mode: 'none' },
    featureOnHome: true,
  },
  {
    id: 'evt-niall-ferguson',
    slug: 'sir-niall-ferguson-on-ai-and-the-future-of-education',
    status: 'published',
    title: 'Sir Niall Ferguson on AI and the Future of Education',
    summary:
      'Decorated historian Niall Ferguson addresses members of the Austin Union, speaking on the looming challenges of AI, the merits of monasticism, and how Universities should react to the crisis of higher-ed on the horizon.',
    description: '',
    startsAt: '2025-06-11T18:00:00-05:00',
    endsAt: '2025-06-11T20:30:00-05:00',
    locationName: 'Private Location',
    image: img('sir-niall-ferguson-on-ai-and-the-future-of-education', 'Sir Niall Ferguson on AI and the Future of Education'),
    rsvp: { mode: 'native' },
    featureOnHome: true,
    recap: {
      youtubeUrl: 'https://youtu.be/dcdA6YqFblw',
      photos: [1, 2, 3, 4, 5].map((n) => recapPhoto(`recap-ferguson-${n}`)),
    },
  },
  {
    id: 'evt-calacanis-rubin-lonsdale',
    slug: 'jason-calacanis-dave-rubin-and-joe-lonsdale',
    status: 'published',
    title: 'Jason Calacanis, Dave Rubin and Joe Lonsdale',
    summary:
      'Media veterans Jason Calacanis and Dave Rubin join UATX Co-Founder Joe Lonsdale to discuss how young people can find success in a modern economy transformed by AGI.',
    description: '',
    startsAt: '2025-05-19T20:00:00-05:00',
    endsAt: '2025-05-20T22:00:00-05:00',
    locationName: 'Austin',
    address: '522 Congress Ave., Austin, TX 78701, USA',
    image: img('jason-calacanis-dave-rubin-and-joe-lonsdale', 'Jason Calacanis, Dave Rubin and Joe Lonsdale'),
    rsvp: { mode: 'native' },
    featureOnHome: true,
    recap: { photos: [1, 2, 3, 4].map((n) => recapPhoto(`recap-calacanis-${n}`)) },
  },
  {
    id: 'evt-marxism',
    slug: 'do-we-need-marxism-today-with-phil-magness-and-clara-mattei',
    status: 'published',
    title: 'Do We Need Marxism Today? with Phil Magness and Clara Mattei',
    summary:
      "Dr. Clara Mattei and Dr. Phillip Magness join the Austin Union to hash out the periodic question of the modern age: 'Do We Need Marxism?' Moderated by our own Merrick Meardon, this heated debate touched on perennial questions of the history, method, viability, and humanity of our economic systems.",
    description: '',
    startsAt: '2025-04-30T18:00:00-05:00',
    endsAt: '2025-04-30T20:00:00-05:00',
    locationName: 'Austin',
    address: '101 W 6th St, Austin, TX 78701, USA',
    image: img('do-we-need-marxism-today-with-phil-magness-and-clara-mattei', 'Do We Need Marxism Today? with Phil Magness and Clara Mattei'),
    rsvp: { mode: 'native' },
    featureOnHome: true,
  },
];
