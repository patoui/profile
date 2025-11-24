import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  parseMarkdown,
  truncateText,
  formatDate,
  formatDateTime,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  stripHtml,
  getShortBody,
} from '../../../src/utils/helpers.js';

describe('generateSlug', () => {
  it('converts text to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello! World?')).toBe('hello-world');
  });

  it('trims whitespace', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world');
  });

  it('handles unicode characters', () => {
    expect(generateSlug('Café au lait')).toBe('cafe-au-lait');
  });
});

describe('parseMarkdown', () => {
  it('converts markdown to HTML', () => {
    const result = parseMarkdown('**bold**');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('converts headings', () => {
    const result = parseMarkdown('# Heading');
    expect(result).toContain('<h1>Heading</h1>');
  });

  it('converts links', () => {
    const result = parseMarkdown('[link](https://example.com)');
    expect(result).toContain('<a href="https://example.com">link</a>');
  });

  it('converts code blocks', () => {
    const result = parseMarkdown('`code`');
    expect(result).toContain('<code>code</code>');
  });

  it('converts lists', () => {
    const result = parseMarkdown('- item 1\n- item 2');
    expect(result).toContain('<li>');
  });
});

describe('truncateText', () => {
  it('returns text unchanged if shorter than limit', () => {
    expect(truncateText('short', 10)).toBe('short');
  });

  it('truncates text at specified length', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
  });

  it('uses default length of 150', () => {
    const longText = 'a'.repeat(200);
    const result = truncateText(longText);
    expect(result.length).toBe(153); // 150 + '...'
  });

  it('returns original if equal to limit', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('handles empty string', () => {
    expect(truncateText('')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date(2024, 0, 15);
    const result = formatDate(date);
    expect(result).toMatch(/Jan\s+15,\s+2024/);
  });

  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('handles different months', () => {
    const date = new Date(2024, 11, 25);
    const result = formatDate(date);
    expect(result).toMatch(/Dec\s+25,\s+2024/);
  });
});

describe('formatDateTime', () => {
  it('formats date and time correctly', () => {
    const date = new Date(2024, 0, 15, 14, 30);
    const result = formatDateTime(date);
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('returns empty string for null', () => {
    expect(formatDateTime(null)).toBe('');
  });
});

describe('getYouTubeEmbedUrl', () => {
  it('returns correct embed URL', () => {
    expect(getYouTubeEmbedUrl('abc123')).toBe(
      'https://www.youtube.com/embed/abc123'
    );
  });

  it('handles longer video IDs', () => {
    expect(getYouTubeEmbedUrl('dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });
});

describe('getYouTubeThumbnailUrl', () => {
  it('returns correct thumbnail URL', () => {
    expect(getYouTubeThumbnailUrl('abc123')).toBe(
      'https://img.youtube.com/vi/abc123/maxresdefault.jpg'
    );
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello');
  });

  it('handles nested tags', () => {
    expect(stripHtml('<div><p><strong>text</strong></p></div>')).toBe('text');
  });

  it('handles self-closing tags', () => {
    expect(stripHtml('Hello<br/>World')).toBe('HelloWorld');
  });

  it('preserves text content', () => {
    expect(stripHtml('no tags here')).toBe('no tags here');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  it('removes attributes', () => {
    expect(stripHtml('<a href="url">link</a>')).toBe('link');
  });
});

describe('getShortBody', () => {
  it('parses markdown and truncates', () => {
    const markdown = '**Bold text** and more content here that is longer';
    const result = getShortBody(markdown, 20);
    expect(result).not.toContain('<strong>');
    expect(result.length).toBeLessThanOrEqual(23);
  });

  it('uses default length of 200', () => {
    const longMarkdown = 'a'.repeat(300);
    const result = getShortBody(longMarkdown);
    expect(result.length).toBe(203);
  });

  it('handles empty markdown', () => {
    expect(getShortBody('')).toBe('');
  });
});
