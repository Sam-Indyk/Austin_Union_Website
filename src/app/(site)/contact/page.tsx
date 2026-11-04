import type { Metadata } from 'next';
import Image from 'next/image';
import { ContactForm } from '@/components/forms/ContactForm';
import { SocialLinks } from '@/components/SocialLinks';
import { blurOf, getContact, getSettings } from '@/lib/content/repo';

export const metadata: Metadata = { title: 'CONTACT' };

export default async function ContactPage() {
  const [contact, settings] = await Promise.all([getContact(), getSettings()]);
  return (
    <div className="contact-page">
      <div className="contact-page__bg" aria-hidden="true">
        <Image src="/media/site/contact-background.jpg" alt="" fill sizes="100vw" loading="eager" placeholder="blur" blurDataURL={blurOf('/media/site/contact-background.jpg')} />
      </div>
      <div className="contact-card">
        <div className="contact-card__top">
          <div className="inner">
            <h1>{contact.title}</h1>
            <p>{contact.intro}</p>
          </div>
        </div>
        <div className="contact-card__chat">
          <div className="inner">
            <h2>{contact.formHeading}</h2>
            <div className="contact-details">
              <div>
                <h3>Phone</h3>
                <a href={`tel:${settings.contact.phone.replace(/[^\d+]/g, '')}`}>{settings.contact.phone}</a>
              </div>
              <div>
                <h3>Email</h3>
                <a href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>
              </div>
              <div>
                <h3>Social Media</h3>
                <SocialLinks links={{ x: settings.social.x }} />
              </div>
            </div>
            <ContactForm variant="page" page="/contact" />
          </div>
        </div>
      </div>
    </div>
  );
}
