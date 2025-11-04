'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  Upload,
  Database,
  Search,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  Tag,
  Calendar,
  FileText,
  Eye,
  Lock,
  Crown,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import type { PlanTier } from '@/lib/plan-info';
import type { CatalogEntry, CatalogStatus, CatalogVisibility } from '@/types';
import { useDatasetStore } from '@/store/dataset-store';
import { useSupabase } from '@/features/auth';
import { formatBytes, formatDate } from '@/lib/formatters';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

const VISIBILITY_LABELS: Record<CatalogVisibility, string> = {
  public: 'Public',
  private: 'Private',
  premium: 'Premium',
};

const STATUS_COLORS: Record<CatalogStatus, string> = {
  approved: 'text-green-600 border-green-200 bg-green-50',
  pending: 'text-amber-600 border-amber-200 bg-amber-50',
  rejected: 'text-red-600 border-red-200 bg-red-50',
  archived: 'text-muted-foreground border-border bg-muted',
};

const ITEMS_PER_PAGE = 12;

// Sample tags - in a real app these would come from the backend
const SAMPLE_TAGS = [
  'Finance', 'Healthcare', 'Technology', 'E-commerce', 'Marketing',
  'Sales', 'Customer Data', 'Analytics', 'Time Series', 'Geographic',
  'Social Media', 'IoT', 'Machine Learning', 'Government', 'Education'
];

interface FilterState {
  search: string;
  visibility: 'all' | CatalogVisibility;
  status: 'all' | CatalogStatus;
  plan: 'all' | PlanTier;
  tags: string[];
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
}

export default function CatalogPage() {
  const router = useRouter();
  const { isAuthenticated } = useSupabase();
  const { setDataset } = useDatasetStore();
  const localizePath = useLocalizedPath();
  const submitDatasetUrl = localizePath('/catalogs/submit');
  const signInUrl = localizePath('/auth?view=sign-in');

  // State management
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    visibility: 'all',
    status: 'all',
    plan: 'all',
    tags: [],
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const loadEntries = async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api.listCatalogEntries();

      // Add mock metadata for demonstration
      const enhancedData = data.map((entry, _index) => ({
        ...entry,
        size: Math.floor(Math.random() * 50000000), // Mock size in bytes
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        tags: SAMPLE_TAGS.slice(Math.floor(Math.random() * 5), Math.floor(Math.random() * 5) + 3),
        downloads: Math.floor(Math.random() * 1000),
        views: Math.floor(Math.random() * 5000)
      }));

      setEntries(enhancedData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load catalog.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  // Apply filters and sorting
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.name.toLowerCase().includes(searchLower) ||
        entry.description?.toLowerCase().includes(searchLower)
      );
    }

    // Visibility filter
    if (filters.visibility !== 'all') {
      filtered = filtered.filter(entry => entry.visibility === filters.visibility);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    // Plan filter
    if (filters.plan !== 'all') {
      filtered = filtered.filter(entry => entry.plan_required === filters.plan);
    }

    // Tag filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(entry =>
        filters.tags.some(tag => (entry as any).tags?.includes(tag))
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date((b as any).createdAt || 0).getTime() -
                      new Date((a as any).createdAt || 0).getTime();
          break;
        case 'size':
          comparison = ((b as any).size || 0) - ((a as any).size || 0);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [entries, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleUseDataset = async (entry: CatalogEntry) => {
    try {
      const result = await api.loadCatalogDataset(entry.id);
      setDataset({
        id: result.datasetId,
        file: null,
        metadata: result.metadata,
      });
      toast.success(`Loaded ${entry.name}`);
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dataset.';
      toast.error(message);
    }
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      visibility: 'all',
      status: 'all',
      plan: 'all',
      tags: [],
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.search || filters.visibility !== 'all' ||
    filters.status !== 'all' || filters.plan !== 'all' || filters.tags.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="container mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 border rounded-3xl border-border/60 bg-card/70 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Dataset Catalog</h1>
              <p className="text-muted-foreground">
                Explore {entries.length} curated datasets from the community
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary/10' : ''}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {filters.tags.length + (filters.search ? 1 : 0) +
                     (filters.visibility !== 'all' ? 1 : 0) +
                     (filters.status !== 'all' ? 1 : 0) +
                     (filters.plan !== 'all' ? 1 : 0)}
                  </Badge>
                )}
              </Button>

              <div className="flex gap-1 bg-muted rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {isAuthenticated ? (
                <Button asChild size="sm">
                  <Link href={submitDatasetUrl}>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Dataset
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href={signInUrl}>
                    Sign in to submit
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search datasets by name or description..."
            value={filters.search}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, search: e.target.value }));
              setCurrentPage(1);
            }}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Visibility</label>
                    <Select
                      value={filters.visibility}
                      onValueChange={(value) => {
                        setFilters(prev => ({ ...prev, visibility: value as any }));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => {
                        setFilters(prev => ({ ...prev, status: value as any }));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Plan Required</label>
                    <Select
                      value={filters.plan}
                      onValueChange={(value) => {
                        setFilters(prev => ({ ...prev, plan: value as any }));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="org">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select
                      value={`${filters.sortBy}-${filters.sortOrder}`}
                      onValueChange={(value) => {
                        const [sortBy, sortOrder] = value.split('-');
                        setFilters(prev => ({
                          ...prev,
                          sortBy: sortBy as any,
                          sortOrder: sortOrder as any
                        }));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Newest First</SelectItem>
                        <SelectItem value="date-asc">Oldest First</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="size-desc">Largest First</SelectItem>
                        <SelectItem value="size-asc">Smallest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_TAGS.map(tag => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/10"
                        onClick={() => toggleTag(tag)}
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full sm:w-auto"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedEntries.length} of {filteredEntries.length} datasets
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading catalog…
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : filteredEntries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No datasets found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search criteria
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Dataset Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paginatedEntries.map((entry) => (
                  <DatasetCard
                    key={entry.id}
                    entry={entry}
                    onUse={handleUseDataset}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedEntries.map((entry) => (
                  <DatasetListItem
                    key={entry.id}
                    entry={entry}
                    onUse={handleUseDataset}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Dataset Card Component
function DatasetCard({
  entry,
  onUse
}: {
  entry: CatalogEntry & { size?: number; createdAt?: string; tags?: string[]; downloads?: number; views?: number };
  onUse: (entry: CatalogEntry) => void;
}) {
  const getVisibilityIcon = () => {
    switch (entry.visibility) {
      case 'public': return <Eye className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      case 'premium': return <Crown className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-border/70 bg-card/80 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1">{entry.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {entry.description || 'No description provided.'}
            </CardDescription>
          </div>
          <Badge
            className={`ml-2 ${STATUS_COLORS[entry.status]}`}
          >
            {entry.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {entry.tags?.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {entry.tags && entry.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{entry.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              {getVisibilityIcon()}
              <span>{VISIBILITY_LABELS[entry.visibility]}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {entry.plan_required.toUpperCase()}
            </Badge>
          </div>

          {entry.size && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{formatBytes(entry.size)}</span>
            </div>
          )}

          {entry.createdAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(entry.createdAt)}</span>
            </div>
          )}

          {(entry.downloads || entry.views) && (
            <div className="flex items-center gap-4 text-muted-foreground text-xs">
              {entry.downloads && <span>{entry.downloads} downloads</span>}
              {entry.views && <span>{entry.views} views</span>}
            </div>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled={entry.status !== 'approved'}
          onClick={() => onUse(entry)}
        >
          <Database className="mr-2 h-4 w-4" />
          Use Dataset
        </Button>
      </CardContent>
    </Card>
  );
}

// Dataset List Item Component
function DatasetListItem({
  entry,
  onUse
}: {
  entry: CatalogEntry & { size?: number; createdAt?: string; tags?: string[]; downloads?: number; views?: number };
  onUse: (entry: CatalogEntry) => void;
}) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{entry.name}</h3>
              <Badge className={`${STATUS_COLORS[entry.status]}`}>
                {entry.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {entry.description || 'No description provided.'}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                {VISIBILITY_LABELS[entry.visibility]}
              </div>
              {entry.size && (
                <span className="text-xs text-muted-foreground">
                  {formatBytes(entry.size)}
                </span>
              )}
              {entry.createdAt && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.createdAt)}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {entry.plan_required.toUpperCase()}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={entry.status !== 'approved'}
            onClick={() => onUse(entry)}
          >
            Use Dataset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Submit Dataset Modal Component
