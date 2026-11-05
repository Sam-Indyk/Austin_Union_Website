import type { RichText as Html } from '@/lib/content/types';

/**
 * Renders admin-authored rich text. Content is restricted to a small HTML
 * subset and sanitized when it is saved (see the admin editor), so it is safe
 * to inject here.
 */
export function RichText({ html, className, ...rest }: { html: Html; className?: string } & Record<`data-${string}`, string>) {
  return <div {...rest} className={['rich', className].filter(Boolean).join(' ')} dangerouslySetInnerHTML={{ __html: html }} />;
}
