'use client';

/**
 * @module composer/wizard/UrlScraper
 * @description URL input and scraping component with preview
 * Uses the backend ScraperService via openstrandAPI
 */

import { useState, useCallback } from 'react';
import { 
  Link, 
  Loader2, 
  Globe, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { openstrandAPI } from '@/services/openstrand.api';
import type { UrlMetadata } from './types';

interface UrlScraperProps {
  url: string;
  onUrlChange: (url: string) => void;
  metadata: UrlMetadata | null;
  onMetadataChange: (metadata: UrlMetadata | null) => void;
  onTitleChange: (title: string) => void;
  onSummaryChange: (summary: string) => void;
  onContentChange: (content: string) => void;
}

export function UrlScraper({
  url,
  onUrlChange,
  metadata,
  onMetadataChange,
  onTitleChange,
  onSummaryChange,
  onContentChange,
}: UrlScraperProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canScrape, setCanScrape] = useState<boolean | null>(null);

  const isValidUrl = useCallback((str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }, []);

  const checkUrl = useCallback(async (urlToCheck: string) => {
    if (!urlToCheck || !isValidUrl(urlToCheck)) return;
    
    try {
      const result = await openstrandAPI.scraper.check(urlToCheck);
      setCanScrape(result.allowed);
      if (!result.allowed && result.reason) {
        setError(`Cannot scrape: ${result.reason}`);
      }
    } catch {
      // Ignore check errors, will fail on actual scrape
      setCanScrape(null);
    }
  }, [isValidUrl]);

  const scrapeUrl = useCallback(async () => {
    if (!url || !isValidUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the backend scraper service
      const data = await openstrandAPI.scraper.scrapeUrl({
        url,
        method: 'auto', // Auto-detect best extraction method
        options: {
          extractMetadata: true,
          downloadImages: false, // Don't download images for wizard preview
        },
      });
      
      const scraped: UrlMetadata = {
        url,
        title: data.title || '',
        description: data.excerpt || '',
        image: data.images?.[0]?.url,
        favicon: undefined, // Not returned by scraper
        siteName: data.sourceType,
        type: data.sourceType,
        author: data.author,
        publishedDate: data.publishDate,
        content: data.content,
        extractedText: data.contentMarkdown || data.content,
      };

      onMetadataChange(scraped);
      
      // Auto-fill form fields
      if (scraped.title) onTitleChange(scraped.title);
      if (scraped.description) onSummaryChange(scraped.description);
      if (scraped.extractedText || scraped.content) {
        onContentChange(scraped.extractedText || scraped.content || '');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scrape URL';
      setError(errorMessage);
      
      // Fallback: try to extract basic info from URL
      try {
        const urlObj = new URL(url);
        const fallbackMeta: UrlMetadata = {
          url,
          title: urlObj.pathname.split('/').pop()?.replace(/-/g, ' ') || urlObj.hostname,
          description: `Content from ${urlObj.hostname}`,
          siteName: urlObj.hostname,
        };
        onMetadataChange(fallbackMeta);
        onTitleChange(fallbackMeta.title);
      } catch {
        // Ignore fallback errors
      }
    } finally {
      setLoading(false);
    }
  }, [url, isValidUrl, onMetadataChange, onTitleChange, onSummaryChange, onContentChange]);

  const handleUrlPaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (isValidUrl(pasted)) {
      onUrlChange(pasted);
      // Auto-scrape on paste
      setTimeout(() => {
        scrapeUrl();
      }, 100);
    }
  }, [isValidUrl, onUrlChange, scrapeUrl]);

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">URL to Import</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              onPaste={handleUrlPaste}
              placeholder="https://example.com/article"
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && scrapeUrl()}
            />
          </div>
          <Button
            type="button"
            onClick={scrapeUrl}
            disabled={loading || !url}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            {loading ? 'Scraping...' : 'Fetch'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste any URL to automatically extract title, description, and content
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={scrapeUrl}
            className="ml-auto h-7 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Preview Card */}
      {metadata && (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          {/* Image Preview */}
          {metadata.image && (
            <div className="relative h-40 bg-muted">
              <img
                src={metadata.image}
                alt={metadata.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className="p-4 space-y-3">
            {/* Site Info */}
            <div className="flex items-center gap-2">
              {metadata.favicon ? (
                <img src={metadata.favicon} alt="" className="w-4 h-4 rounded" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {metadata.siteName || new URL(metadata.url).hostname}
              </span>
              {metadata.type && (
                <Badge variant="secondary" className="text-[10px]">
                  {metadata.type}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground line-clamp-2">
              {metadata.title}
            </h3>

            {/* Description */}
            {metadata.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {metadata.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              {metadata.author && (
                <Badge variant="outline" className="text-xs">
                  By {metadata.author}
                </Badge>
              )}
              {metadata.publishedDate && (
                <Badge variant="outline" className="text-xs">
                  {new Date(metadata.publishedDate).toLocaleDateString()}
                </Badge>
              )}
              {metadata.extractedText && (
                <Badge variant="outline" className="text-xs gap-1">
                  <FileText className="h-3 w-3" />
                  {metadata.extractedText.split(' ').length} words
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3.5 w-3.5" />
                Content extracted
              </div>
              <a
                href={metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View original
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !metadata && (
        <div className="border border-border rounded-xl p-8 bg-card">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="font-medium">Scraping URL...</p>
              <p className="text-sm text-muted-foreground">
                Extracting content and metadata
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !metadata && !error && url && isValidUrl(url) && (
        <div className="border border-dashed border-border rounded-xl p-8 bg-muted/30">
          <div className="flex flex-col items-center gap-3 text-center">
            <Globe className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Ready to fetch</p>
              <p className="text-sm text-muted-foreground">
                Click "Fetch" to extract content from this URL
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

