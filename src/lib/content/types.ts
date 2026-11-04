// Content model for the Austin Union site.
//
// These shapes mirror the Supabase tables the admin "edit mode" will write to.
// Everything the public site renders comes through src/lib/content/repo.ts,
// so swapping the seed data for the database touches only that file.

/** A limited HTML subset: <p>, <strong>, <em>, <a href>, <br>. Sanitized on save. */
export type RichText = string;

export interface ImageRef {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  /** Focal point (0–100) used for object-position when the image is cropped. */
  focalX?: number;
  focalY?: number;
}

export interface SocialLinks {
  x?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  facebook?: string;
}

export interface SiteSettings {
  siteName: string;
  /** Footer copyright holder text; the year is filled in automatically. */
  copyrightHolder: string;
  social: SocialLinks;
  donateUrl: string;
  contact: { phone: string; email: string };
  /** Event times are entered and shown in this zone. */
  timezone: string;
}

export interface HomeContent {
  /** The two centered bold lines above the essay. */
  epigraph: string[];
  /** Essay paragraphs (RichText each). The first word of the first paragraph becomes the drop cap. */
  essay: RichText[];
  /** Shown in the announcement card when no event is featured. */
  fallbackCard: { title: string; subtitle: string; linkLabel: string; linkHref: string };
}

export type SectionTheme = 'red' | 'cream' | 'navy' | 'charcoal';
export type OrnamentColor = 'gold' | 'red';

export interface MissionSection {
  id: string;
  heading: string;
  /** A glyph from the Colonial Bullets ornament font. */
  ornament: string;
  ornamentColor: OrnamentColor;
  theme: SectionTheme;
  body: RichText;
}

export interface MissionContent {
  title: string;
  sections: MissionSection[];
  contactSection: { heading: string; ornament: string; intro: string; theme: SectionTheme };
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  photo: ImageRef;
  x?: string;
  linkedin?: string;
}

export interface TeamContent {
  title: string;
  motto: string;
  intro: RichText;
  members: TeamMember[];
}

export interface DonateContent {
  title: string;
  body: RichText[];
  buttonLabel: string;
}

export interface ContactContent {
  title: string;
  intro: string;
  formHeading: string;
}

export interface CollagePhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  focalX?: number;
  focalY?: number;
}

/** How RSVPs are handled for an event. */
export type RsvpMode =
  /** Collect RSVPs on austinunion.org. */
  | 'native'
  /** No RSVP needed / informational only. */
  | 'none';

export interface PartnerRegistration {
  /** Currently only UATX's Swoogo. */
  kind: 'swoogo';
  /** Public registration page, used as the hand-off link when no API access. */
  url: string;
  /** Swoogo event id, needed for API registration. */
  swoogoEventId?: string;
}

export interface EventRecap {
  summary?: RichText;
  youtubeUrl?: string;
  photos: ImageRef[];
}

export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface EventItem {
  id: string;
  slug: string;
  status: EventStatus;
  /** If set, the event stays hidden until this moment (scheduled publishing). */
  publishAt?: string;
  title: string;
  /** One or two sentences shown under the title on the event page and the "More info" toggle. */
  summary: string;
  /** Long description ("About the Event"). */
  description: RichText;
  /** ISO 8601 with offset. */
  startsAt: string;
  endsAt: string;
  locationName: string;
  address?: string;
  image: ImageRef;
  rsvp: {
    mode: RsvpMode;
    /** Stop accepting RSVPs after this time (defaults to the start time). */
    closesAt?: string;
    capacity?: number;
    partner?: PartnerRegistration;
    /** Legacy events whose RSVPs lived elsewhere: link the button straight to this URL. */
    externalUrl?: string;
  };
  /** Show the announcement card on the homepage while the event is upcoming. */
  featureOnHome: boolean;
  /** Optional overrides for the homepage card wording. */
  homeCard?: { title?: string; subtitle?: string };
  recap?: EventRecap;
}
