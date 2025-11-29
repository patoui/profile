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

export function getShortBody(body: string, length: number = 100): string {
  const text = body
    // Remove markdown links [text](url) but keep the text
    // eslint-disable-next-line no-useless-escape
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove standalone URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove markdown headings (##, ###, etc.)
    .replace(/^#+\s+/gm, '')
    // Remove code blocks (```...```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold/italic markers (**, __, *, _)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough (~~)
    .replace(/~~(.*?)~~/g, '$1')
    // Remove blockquote markers
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules (---, ***, ___)
    .replace(/^[-*_]{3,}$/gm, '')
    // Replace multiple newlines with space
    .replace(/(\r?\n){2,}/g, ' ')
    // Replace single newlines with space
    .replace(/\r?\n/g, ' ')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    .trim()
    // Remove "Introduction" from the beginning (case-insensitive)
    .replace(/^introduction\s*/i, '');

  // If text is already shorter than length, return as-is
  if (text.length <= length) {
    return text;
  }

  // Truncate at word boundary
  const truncated = text.substring(0, length);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  // If we found a space, truncate there; otherwise use the full truncated length
  const finalText = lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated;

  return finalText + '...';
}
