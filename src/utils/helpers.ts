import { marked } from 'marked';

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function parseMarkdown(content: string): string {
  return marked(content) as string;
}

export function truncateText(text: string, length: number = 150): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

export function formatDate(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(date: Date | null): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getYouTubeEmbedUrl(externalId: string): string {
  return `https://www.youtube.com/embed/${externalId}`;
}

export function getYouTubeThumbnailUrl(externalId: string): string {
  return `https://img.youtube.com/vi/${externalId}/maxresdefault.jpg`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

export function getShortBody(body: string, length: number = 200): string {
  const plainText = stripHtml(parseMarkdown(body));
  return truncateText(plainText, length);
}
