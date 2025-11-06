'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Database,
  FileText,
  Filter,
  Grid,
  Image,
  List,
  MoreVertical,
  Plus,
  Search,
  Tag,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { formatRelativeTime } from '@/lib/utils';

type StrandType = 'document' | 'image' | 'dataset';

interface StrandSummary {
  id: string;
  title: string;
  type: StrandType;
  contentPreview: string;
  tags: string[];
  createdAt: string;
  connections: number;
}

const mockStrands: StrandSummary[] = [
  {
    id: '1',
    title: 'Machine Learning Fundamentals',
    type: 'document',
    contentPreview:
      'An introduction to the basic concepts of machine learning including supervised and unsupervised learning...',
    tags: ['ml', 'ai', 'fundamentals'],
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    connections: 12,
  },
  {
    id: '2',
    title: 'Neural Network Architecture Diagram',
    type: 'image',
    contentPreview:
      'Visual representation of a feedforward neural network with 3 hidden layers...',
    tags: ['neural-networks', 'visualization'],
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    connections: 8,
  },
  {
    id: '3',
    title: 'Customer Segmentation Dataset',
    type: 'dataset',
    contentPreview:
      '10,000 customer records with demographics and purchase history for clustering analysis...',
    tags: ['data', 'customers', 'clustering'],
    createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    connections: 5,
  },
];

const typeIcons: Record<StrandType, typeof FileText> = {
  document: FileText,
  image: Image,
  dataset: Database,
};

const typeColors: Record<StrandType, string> = {
  document: 'text-blue-600 dark:text-blue-400',
  image: 'text-purple-600 dark:text-purple-400',
  dataset: 'text-green-600 dark:text-green-400',
};

export function StrandsManager(): JSX.Element {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const localizePath = useLocalizedPath();

  const filteredStrands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return mockStrands;
    }

    return mockStrands.filter((strand) => {
      const haystack =
        `${strand.title} ${strand.contentPreview} ${strand.tags.join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [searchQuery]);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-7xl">
          <Card className="mb-6 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search strands..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </Button>
                <div className="flex rounded-md border border-input">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button asChild className="gap-2">
                  <Link href={localizePath('/composer?origin=strands')} prefetch={false}>
                    <Plus className="h-4 w-4" />
                    New Strand
                  </Link>
                </Button>
              </div>
            </div>
          </Card>

          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStrands.map((strand) => {
                const Icon = typeIcons[strand.type];
                const iconColor = typeColors[strand.type];

                return (
                  <Card
                    key={strand.id}
                    className="group cursor-pointer p-5 transition-all hover:shadow-lg"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className={`rounded-lg bg-muted p-2 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    <h3 className="mb-2 font-semibold line-clamp-1">{strand.title}</h3>
                    <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                      {strand.contentPreview}
                    </p>

                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {strand.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(strand.createdAt)}
                      </span>
                      <span>{strand.connections} connections</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {filteredStrands.map((strand) => {
                    const Icon = typeIcons[strand.type];
                    const iconColor = typeColors[strand.type];

                    return (
                      <div
                        key={strand.id}
                        className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className={`rounded-lg bg-muted p-2 ${iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold">{strand.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {strand.contentPreview}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatRelativeTime(strand.createdAt)}</span>
                            <span aria-hidden="true">•</span>
                            <span>{strand.connections} connections</span>
                            <span aria-hidden="true">•</span>
                            <div className="flex gap-1">
                              {strand.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Open strand options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
