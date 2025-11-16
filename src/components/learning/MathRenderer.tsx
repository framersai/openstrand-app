'use client';

/**
 * @module MathRenderer
 * @description LaTeX math rendering using KaTeX
 * 
 * Features:
 * - Inline math: $expression$
 * - Display math: $$expression$$
 * - Auto-detects and renders LaTeX
 * - Error handling with fallback display
 * - Supports complex equations
 */

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  /** Content with potential LaTeX expressions */
  content: string;
  
  /** Display mode (block) for all math */
  displayMode?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Parse content and render LaTeX math expressions
 */
export function MathRenderer({ content, displayMode = false, className }: MathRendererProps) {
  const rendered = useMemo(() => {
    if (!content) return null;

    // Split content by LaTeX delimiters
    const parts: Array<{ type: 'text' | 'math'; content: string; display?: boolean }> = [];
    let currentIndex = 0;
    
    // Regex for $$display$$ and $inline$
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
    let match;

    while ((match = mathRegex.exec(content)) !== null) {
      // Add text before math
      if (match.index > currentIndex) {
        parts.push({
          type: 'text',
          content: content.substring(currentIndex, match.index),
        });
      }

      // Add math expression
      const mathContent = match[0];
      const isDisplay = mathContent.startsWith('$$');
      const expression = mathContent.replace(/^\$+|\$+$/g, ''); // Strip delimiters

      parts.push({
        type: 'math',
        content: expression,
        display: isDisplay || displayMode,
      });

      currentIndex = match.index + mathContent.length;
    }

    // Add remaining text
    if (currentIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(currentIndex),
      });
    }

    // If no math found, return plain text
    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }

    return parts;
  }, [content, displayMode]);

  if (!rendered) return null;

  return (
    <div className={className}>
      {rendered.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.content}</span>;
        }

        // Render LaTeX
        try {
          const html = katex.renderToString(part.content, {
            displayMode: part.display,
            throwOnError: false,
            output: 'html',
            strict: false,
          });

          return (
            <span
              key={index}
              className={part.display ? 'block my-4' : 'inline'}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (error) {
          // Fallback: show raw LaTeX if rendering fails
          return (
            <span
              key={index}
              className="text-destructive bg-destructive/10 px-1 rounded"
              title={`LaTeX Error: ${error instanceof Error ? error.message : 'Unknown error'}`}
            >
              {part.display ? `$$${part.content}$$` : `$${part.content}$`}
            </span>
          );
        }
      })}
    </div>
  );
}

/**
 * Simple inline math renderer
 */
export function InlineMath({ children }: { children: string }) {
  try {
    const html = katex.renderToString(children, {
      displayMode: false,
      throwOnError: false,
    });

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error) {
    return (
      <span className="text-destructive">
        ${children}$
      </span>
    );
  }
}

/**
 * Display (block) math renderer
 */
export function DisplayMath({ children }: { children: string }) {
  try {
    const html = katex.renderToString(children, {
      displayMode: true,
      throwOnError: false,
    });

    return <div className="my-4" dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error) {
    return (
      <div className="my-4 text-destructive">
        $${children}$$
      </div>
    );
  }
}


