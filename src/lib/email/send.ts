// Sends email the site itself originates (verification codes, RSVP
// confirmations, and later announcements). Locally this goes to Mailpit
// (http://127.0.0.1:54324); in production SMTP_URL points at the email
// provider (e.g. Resend or Amazon SES SMTP).
import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { LOGO_PNG_BASE64 } from './logo';

/**
 * The seal travels inside each email (as an inline attachment) instead of being
 * loaded from the website, so it appears even where web images are blocked.
 */
const LOGO_CID = 'seal@austinunion.org';
export const LOGO_SRC = `cid:${LOGO_CID}`;

/** For showing an email in a browser (admin previews), where cid: images can't load. */
export const forBrowser = (html: string) => html.replaceAll(LOGO_SRC, `data:image/png;base64,${LOGO_PNG_BASE64}`);

let transport: Transporter | undefined;

function getTransport(): Transporter {
  const url = process.env.SMTP_URL;
  if (!url) throw new Error('Email is not configured (SMTP_URL).');
  return (transport ??= nodemailer.createTransport(url));
}

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export async function sendMail(mail: Mail): Promise<void> {
  await getTransport().sendMail({
    from: process.env.EMAIL_FROM ?? 'Austin Union <events@austinunion.org>',
    ...mail,
    attachments: mail.html.includes(LOGO_SRC)
      ? [{ filename: 'austin-union.png', content: Buffer.from(LOGO_PNG_BASE64, 'base64'), cid: LOGO_CID, contentType: 'image/png', contentDisposition: 'inline' }]
      : undefined,
  });
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The house style shared by every email: seal, red masthead, serif body. */
export function layout({ title, body, cta }: { title: string; body: string; cta?: { label: string; href: string } }): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#ededE4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ededE4;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:3px solid #2f2e2e;">
<tr><td style="background:#7f1f20;padding:28px 32px 22px;text-align:center;border-bottom:5px solid #f7b3b3;">
<img src="${LOGO_SRC}" width="72" height="72" alt="" style="display:block;margin:0 auto 12px;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:2px;color:#ffffff;">AUSTIN UNION</div></td></tr>
<tr><td style="padding:32px 36px 12px;font-family:Georgia,'Times New Roman',serif;color:#2f2e2e;text-align:center;">
<div style="font-size:22px;margin:0 0 12px;">${esc(title)}</div>${body}
${cta ? `<a href="${esc(cta.href)}" style="display:inline-block;margin:8px 0 6px;background:#7f1f20;color:#ffffff;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:17px;letter-spacing:1px;padding:12px 34px;">${esc(cta.label)}</a>` : ''}
</td></tr>
<tr><td style="padding:24px 36px 30px;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.6;color:#8a8888;text-align:center;">Veritas per disputandem.</td></tr>
</table></td></tr></table></body></html>`;
}

export function codeEmail(code: string, purpose: string) {
  return {
    subject: `Your Austin Union code: ${code}`,
    html: layout({
      title: 'Your verification code',
      body: `<div style="font-size:15px;line-height:1.6;color:#605e5e;margin:0 0 22px;">${esc(purpose)} It expires in 15 minutes.</div>
<div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:bold;letter-spacing:10px;color:#7f1f20;background:#f0f0e9;padding:16px 10px;margin:0 0 18px;">${esc(code)}</div>
<div style="font-size:13px;color:#8a8888;margin:0 0 8px;">If you didn’t request this, you can ignore this email.</div>`,
    }),
    text: `${purpose}\n\nYour code: ${code}\n\nIt expires in 15 minutes.`,
  };
}
