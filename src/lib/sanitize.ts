// Cleans rich text from the editors before it is saved: only simple formatting
// survives (paragraphs, bold, italic, links, lists), so pasted content can't
// break the page layout or inject scripts.
import sanitizeHtml from 'sanitize-html';

export function sanitizeRich(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li'],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      b: 'strong',
      i: 'em',
      a: sanitizeHtml.simpleTransform('a', {}, true),
    },
    exclusiveFilter: (frame) => frame.tag === 'a' && !frame.attribs.href,
  }).trim();
}

export function plainText(input: string, max = 2000): string {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).replace(/\s+\n/g, '\n').trim().slice(0, max);
}
