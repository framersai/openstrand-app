'use client';

/**
 * @module DataSourceTabs
 * @description Three-tab data source browser:
 * 1. Datasets - CSV, JSON, visualization-ready data
 * 2. Codex - Markdown docs, wiki from framersai/codex weaves/
 * 3. Community - User-uploaded content, voting, featured gallery
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Database,
  BookOpen,
  Users,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileJson,
  Image as ImageIcon,
  Music,
  Video,
  ChevronRight,
  ChevronDown,
  Loader2,
  Search,
  Filter,
  GitBranch,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  Info,
  Settings,
  FolderGit2,
  FileCode,
  AlertCircle,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { SampleDatasetSummary } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface RepoFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha?: string;
  url?: string;
  download_url?: string;
}

export interface CodexDocument {
  id: string;
  title: string;
  path: string;
  type: 'markdown' | 'image' | 'audio' | 'video' | 'other';
  size: number;
  lastModified?: string;
  category?: string;
  tags?: string[];
}

export interface CommunityItem {
  id: string;
  title: string;
  description?: string;
  type: 'dataset' | 'visualization' | 'document';
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  votes: {
    up: number;
    down: number;
  };
  views: number;
  downloads: number;
  createdAt: string;
  featured?: boolean;
  tags?: string[];
  thumbnail?: string;
}

export type FileFilter = 'all' | 'markdown' | 'images' | 'audio' | 'data';
export type CommunitySortBy = 'popular' | 'recent' | 'trending' | 'featured';

interface DataSourceTabsProps {
  // Datasets tab
  samples: SampleDatasetSummary[];
  isLoadingSamples: boolean;
  activeDatasetId?: string;
  onLoadSample: (filename: string) => Promise<void>;
  isProcessing: boolean;
  
  // Config
  codexRepo?: string; // Default: 'framersai/codex'
  codexBranch?: string; // Default: 'master'
  codexPath?: string; // Default: 'weaves'
}

// ============================================================================
// File Type Utilities
// ============================================================================

const FILE_ICONS: Record<string, React.ElementType> = {
  markdown: FileText,
  image: ImageIcon,
  audio: Music,
  video: Video,
  json: FileJson,
  csv: FileSpreadsheet,
  data: Database,
  code: FileCode,
  folder: FolderOpen,
  default: FileText,
};

const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (['md', 'mdx', 'markdown'].includes(ext)) return 'markdown';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['json', 'jsonl'].includes(ext)) return 'json';
  if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext)) return 'csv';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rs', 'go'].includes(ext)) return 'code';
  
  return 'default';
};

const getFileIcon = (filename: string, isDir: boolean): React.ElementType => {
  if (isDir) return FolderOpen;
  const type = getFileType(filename);
  return FILE_ICONS[type] || FILE_ICONS.default;
};

const shouldShowFile = (filename: string, filter: FileFilter, gitignorePatterns: string[]): boolean => {
  // Check gitignore patterns
  for (const pattern of gitignorePatterns) {
    if (pattern.startsWith('!')) continue; // Skip negation patterns for now
    if (filename.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
      return false;
    }
  }
  
  if (filter === 'all') return true;
  
  const type = getFileType(filename);
  switch (filter) {
    case 'markdown': return type === 'markdown';
    case 'images': return type === 'image';
    case 'audio': return type === 'audio';
    case 'data': return ['json', 'csv'].includes(type);
    default: return true;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============================================================================
// Repository Browser Component
// ============================================================================

interface RepoBrowserProps {
  repo: string;
  branch: string;
  basePath: string;
  filter: FileFilter;
  searchQuery: string;
  onFileSelect: (file: RepoFile) => void;
}

function RepoBrowser({ repo, branch, basePath, filter, searchQuery, onFileSelect }: RepoBrowserProps) {
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(basePath);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set([basePath]));
  const [gitignorePatterns, setGitignorePatterns] = useState<string[]>([
    'node_modules', '.git', '.DS_Store', '*.log', 'dist', 'build'
  ]);

  const fetchContents = useCallback(async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Path not found: ${path}`);
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both array (directory) and object (file) responses
      const items: RepoFile[] = Array.isArray(data) ? data : [data];
      
      setFiles(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repository');
    } finally {
      setLoading(false);
    }
  }, [repo, branch]);

  useEffect(() => {
    fetchContents(currentPath);
  }, [currentPath, fetchContents]);

  // Filter files based on search and file type filter
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Search filter
      if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Type filter (only for files, not directories)
      if (file.type === 'file' && !shouldShowFile(file.name, filter, gitignorePatterns)) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // Directories first
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [files, searchQuery, filter, gitignorePatterns]);

  const handleNavigate = (file: RepoFile) => {
    if (file.type === 'dir') {
      setCurrentPath(file.path);
      setExpandedDirs(prev => new Set([...prev, file.path]));
    } else {
      onFileSelect(file);
    }
  };

  const handleGoUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || basePath;
    setCurrentPath(parentPath);
  };

  // Breadcrumb path segments
  const pathSegments = currentPath.split('/').filter(Boolean);

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading repository...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <AlertCircle className="h-8 w-8 mb-2 text-destructive/60" />
        <p className="text-sm text-center">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => fetchContents(currentPath)} className="mt-2">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto pb-1">
        <button
          onClick={() => setCurrentPath(basePath)}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <FolderGit2 className="h-3 w-3" />
          {repo.split('/')[1]}
        </button>
        {pathSegments.map((segment, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="h-3 w-3 flex-shrink-0" />
            <button
              onClick={() => setCurrentPath(pathSegments.slice(0, idx + 1).join('/'))}
              className={cn(
                "hover:text-foreground transition-colors truncate max-w-[100px]",
                idx === pathSegments.length - 1 && "text-foreground font-medium"
              )}
            >
              {segment}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* File List */}
      <div className="border rounded-lg overflow-hidden divide-y divide-border/50">
        {currentPath !== basePath && (
          <button
            onClick={handleGoUp}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
          >
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">..</span>
          </button>
        )}
        
        {filteredFiles.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            No files match your filters
          </div>
        ) : (
          filteredFiles.map((file) => {
            const Icon = getFileIcon(file.name, file.type === 'dir');
            const fileType = file.type === 'dir' ? 'folder' : getFileType(file.name);
            
            return (
              <button
                key={file.sha || file.path}
                onClick={() => handleNavigate(file)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 transition-colors text-left",
                  file.type === 'dir' && "font-medium"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 flex-shrink-0",
                  file.type === 'dir' ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="flex-1 truncate">{file.name}</span>
                {file.size && file.type === 'file' && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                )}
                {file.type === 'dir' && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            );
          })
        )}
      </div>
      
      {loading && files.length > 0 && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Community Feed Component
// ============================================================================

interface CommunityFeedProps {
  sortBy: CommunitySortBy;
  onSortChange: (sort: CommunitySortBy) => void;
  onItemSelect: (item: CommunityItem) => void;
}

function CommunityFeed({ sortBy, onSortChange, onItemSelect }: CommunityFeedProps) {
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for now - will be replaced with API call
  useEffect(() => {
    setLoading(true);
    // Simulated API delay
    setTimeout(() => {
      setItems([
        {
          id: '1',
          title: 'Sales Performance Dashboard',
          description: 'Interactive visualization of Q4 sales metrics',
          type: 'visualization',
          author: { id: 'u1', name: 'DataWiz', avatar: undefined },
          votes: { up: 142, down: 8 },
          views: 2340,
          downloads: 89,
          createdAt: '2024-01-15T10:00:00Z',
          featured: true,
          tags: ['sales', 'dashboard', 'charts'],
        },
        {
          id: '2',
          title: 'Global Climate Dataset 2024',
          description: 'Comprehensive climate data from 195 countries',
          type: 'dataset',
          author: { id: 'u2', name: 'ClimateResearch', avatar: undefined },
          votes: { up: 89, down: 3 },
          views: 1520,
          downloads: 234,
          createdAt: '2024-01-14T15:30:00Z',
          featured: false,
          tags: ['climate', 'environment', 'global'],
        },
        {
          id: '3',
          title: 'Machine Learning Cheatsheet',
          description: 'Quick reference guide for ML algorithms',
          type: 'document',
          author: { id: 'u3', name: 'MLMaster', avatar: undefined },
          votes: { up: 256, down: 12 },
          views: 5680,
          downloads: 1203,
          createdAt: '2024-01-10T08:00:00Z',
          featured: true,
          tags: ['ml', 'reference', 'algorithms'],
        },
      ]);
      setLoading(false);
    }, 500);
  }, [sortBy]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down);
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'trending':
          // Simple trending score: votes + views in last 24h
          return (b.votes.up + b.views / 10) - (a.votes.up + a.views / 10);
        case 'featured':
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        default:
          return 0;
      }
    });
  }, [items, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading community content...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as CommunitySortBy)}>
          <SelectTrigger className="h-8 text-xs w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">
              <span className="flex items-center gap-1.5">
                <Star className="h-3 w-3" /> Featured
              </span>
            </SelectItem>
            <SelectItem value="popular">
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="h-3 w-3" /> Popular
              </span>
            </SelectItem>
            <SelectItem value="recent">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Recent
              </span>
            </SelectItem>
            <SelectItem value="trending">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" /> Trending
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {sortedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(item)}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all",
              "hover:border-primary/30 hover:bg-accent/30",
              item.featured && "border-primary/20 bg-primary/5"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0",
                item.type === 'visualization' && "bg-purple-500/10 text-purple-500",
                item.type === 'dataset' && "bg-blue-500/10 text-blue-500",
                item.type === 'document' && "bg-green-500/10 text-green-500"
              )}>
                {item.type === 'visualization' && <TrendingUp className="h-4 w-4" />}
                {item.type === 'dataset' && <Database className="h-4 w-4" />}
                {item.type === 'document' && <FileText className="h-4 w-4" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{item.title}</span>
                  {item.featured && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary">
                      Featured
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />
                    {item.votes.up}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {item.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {item.downloads}
                  </span>
                  <span>by {item.author.name}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DataSourceTabs({
  samples,
  isLoadingSamples,
  activeDatasetId,
  onLoadSample,
  isProcessing,
  codexRepo = 'framersai/codex',
  codexBranch = 'master',
  codexPath = 'weaves',
}: DataSourceTabsProps) {
  const [activeTab, setActiveTab] = useState<'datasets' | 'codex' | 'community'>('datasets');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<FileFilter>('all');
  const [communitySortBy, setCommunitySortBy] = useState<CommunitySortBy>('featured');

  const handleCodexFileSelect = useCallback((file: RepoFile) => {
    // Handle file selection - could open preview, download, etc.
    console.log('Selected codex file:', file);
    if (file.download_url) {
      window.open(file.download_url, '_blank');
    }
  }, []);

  const handleCommunityItemSelect = useCallback((item: CommunityItem) => {
    // Handle community item selection
    console.log('Selected community item:', item);
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid grid-cols-3 h-9 bg-muted/50">
            <TabsTrigger value="datasets" className="text-xs gap-1.5">
              <Database className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Datasets</span>
            </TabsTrigger>
            <TabsTrigger value="codex" className="text-xs gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Codex</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
          </TabsList>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  activeTab === 'datasets' ? 'Search datasets...' :
                  activeTab === 'codex' ? 'Search documents...' :
                  'Search community...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
            
            {activeTab === 'codex' && (
              <Select value={fileFilter} onValueChange={(v) => setFileFilter(v as FileFilter)}>
                <SelectTrigger className="h-8 w-[100px] text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Files</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="images">Images</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Datasets Tab */}
          <TabsContent value="datasets" className="mt-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">
                CSV, JSON, and other visualization-ready data
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">
                    These datasets are optimized for creating charts, graphs, and data visualizations.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            {isLoadingSamples ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Loading datasets...</span>
              </div>
            ) : samples.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No datasets available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {samples
                  .filter(s => !searchQuery || s.filename.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((sample) => {
                    const isActive = activeDatasetId === sample.id;
                    return (
                      <button
                        key={sample.id}
                        onClick={() => onLoadSample(sample.filename)}
                        disabled={isProcessing}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                          "hover:border-primary/30 hover:bg-accent/30",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          isActive && "border-primary bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{sample.filename}</span>
                            {isActive && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{sample.rowCount?.toLocaleString() || '?'} rows</span>
                            <span>•</span>
                            <span>{sample.columnCount || '?'} columns</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </TabsContent>

          {/* Codex Tab */}
          <TabsContent value="codex" className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span>{codexRepo}</span>
                <span>/</span>
                <span>{codexPath}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`https://github.com/${codexRepo}/tree/${codexBranch}/${codexPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Open in GitHub</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <RepoBrowser
              repo={codexRepo}
              branch={codexBranch}
              basePath={codexPath}
              filter={fileFilter}
              searchQuery={searchQuery}
              onFileSelect={handleCodexFileSelect}
            />
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">
                Community uploads, visualizations & featured content
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[220px]">
                  <p className="text-xs">
                    Browse community-contributed content. Vote on your favorites and discover trending visualizations.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <CommunityFeed
              sortBy={communitySortBy}
              onSortChange={setCommunitySortBy}
              onItemSelect={handleCommunityItemSelect}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

export default DataSourceTabs;

