// ──────────────────────────────────────────────
// The Reflector – AI Markdown Text
// ──────────────────────────────────────────────
// Renders AI responses with proper markdown formatting.
// Bold = bold, italic = italic, lists = bullets, etc.

import React from 'react';
import Markdown from 'react-native-markdown-display';
import { COLORS } from '@/constants/theme';

interface AIMarkdownProps {
  children: string;
}

const markdownStyles = {
  body: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  strong: {
    color: COLORS.textPrimary,
    fontWeight: '700' as const,
  },
  em: {
    fontStyle: 'italic' as const,
    color: COLORS.textSecondary,
  },
  heading1: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900' as const,
    marginBottom: 8,
    marginTop: 12,
  },
  heading2: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 6,
    marginTop: 10,
  },
  heading3: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 4,
    marginTop: 8,
  },
  paragraph: {
    marginBottom: 8,
    marginTop: 0,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list_icon: {
    color: COLORS.crimson,
    fontSize: 14,
    marginRight: 8,
  },
  ordered_list_icon: {
    color: COLORS.crimson,
    fontSize: 13,
    fontWeight: '700' as const,
    marginRight: 8,
  },
  blockquote: {
    backgroundColor: 'rgba(139, 74, 74, 0.06)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.crimson,
    paddingLeft: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: COLORS.surface2,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: COLORS.surface2,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: 'monospace',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  hr: {
    backgroundColor: COLORS.border,
    height: 1,
    marginVertical: 12,
  },
  link: {
    color: COLORS.crimson,
    textDecorationLine: 'underline' as const,
  },
};

export default function AIMarkdown({ children }: AIMarkdownProps) {
  return (
    <Markdown style={markdownStyles}>
      {children}
    </Markdown>
  );
}
