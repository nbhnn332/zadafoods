import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, safe React Markdown Renderer.
 * Supports headings, paragraphs, bold, italic, ordered/unordered lists, blockquotes, and links.
 * Strips dangerous HTML to ensure complete XSS immunity.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Sanitize input: remove raw scripts/styles/html tags for security
  const sanitized = content.replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, '');

  // Split content into blocks by double newlines or blank lines
  const lines = sanitized.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let currentParagraphLines: string[] = [];
  let blockKey = 0;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join('\n').trim();
      if (text) {
        elements.push(
          <p key={`p-${blockKey++}`} className="leading-relaxed text-content-secondary my-2.5">
            {renderInlineMarkdown(text)}
          </p>
        );
      }
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      const ListTag = currentList.type;
      elements.push(
        <ListTag
          key={`list-${blockKey++}`}
          className={`my-3 pl-5 space-y-1 text-content-secondary ${
            currentList.type === 'ul' ? 'list-disc' : 'list-decimal'
          }`}
        >
          {currentList.items.map((item, idx) => (
            <li key={`li-${idx}`} className="leading-relaxed">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ListTag>
      );
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line -> boundary
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('#')) {
      flushParagraph();
      flushList();
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${blockKey++}`} className="font-serif text-lg font-bold text-content-primary mt-4 mb-1.5">
            {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${blockKey++}`} className="font-serif text-xl sm:text-2xl font-bold text-content-primary mt-5 mb-2">
            {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${blockKey++}`} className="font-serif text-2xl sm:text-3xl font-extrabold text-content-primary mt-6 mb-2.5">
            {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
          </h1>
        );
      } else {
        currentParagraphLines.push(trimmed);
      }
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={`quote-${blockKey++}`}
          className="border-l-4 border-[#A67732] pl-4 py-2 my-3 bg-[#FAF7F2] rounded-r-xl font-serif text-sm sm:text-base text-[#072C20] italic font-medium"
        >
          {renderInlineMarkdown(quoteText)}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List (1. 2. etc)
    const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[1]);
      continue;
    }

    // Regular line in paragraph
    currentParagraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return <div className={`space-y-1.5 ${className}`}>{elements}</div>;
};

/**
 * Renders bold, italic, and safe links inside text lines.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Regex pattern matching [text](url), **bold**, *italic*
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      // Safety check: only allow safe http, https, or relative routes
      const isSafe = /^(\/|https?:\/\/|mailto:|tel:)/i.test(url);
      const safeUrl = isSafe ? url : '#';
      const isExternal = safeUrl.startsWith('http');
      return (
        <a
          key={`link-${idx}`}
          href={safeUrl}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-brand-primary underline hover:text-brand-primary-hover font-semibold transition-colors"
        >
          {label}
        </a>
      );
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={`bold-${idx}`} className="font-bold text-content-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={`em-${idx}`} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}
