'use client';

/**
 * @module DataSourceTabs
 * @description Three-tab data source browser with proper hierarchy:
 * 
 * Structure:
 * - Weaves (top-level collections, like "wiki", "frame", "openstrand")
 *   - Looms (sub-collections within weaves)
 *     - Strands (individual documents/files)
 * 
 * Tabs:
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
  Star,
  Clock,
  TrendingUp,
  Eye,
  Download,
  RefreshCw,
  Info,
  FolderGit2,
  FileCode,
  AlertCircle,
  Layers,
  ScrollText,
  Library,
  Bookmark,
  Hash,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import type { SampleDatasetSummary } from '@/types';

// ============================================================================
// Types
// ============================================================================

export type NodeType = 'weave' | 'loom' | 'strand' | 'file' | 'dir';

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  nodeType: NodeType; // weave, loom, or strand
  size?: number;
  sha?: string;
  url?: string;
  download_url?: string;
  children?: TreeNode[];
  depth: number;
  isExpanded?: boolean;
}

export interface CommunityItem {
  id: string;
  title: string;
  description?: string;
  type: 'dataset' | 'visualization' | 'document';
  author: { id: string; name: string; avatar?: string };
  votes: { up: number; down: number };
  views: number;
  downloads: number;
  createdAt: string;
  featured?: boolean;
  tags?: string[];
}

export type FileFilter = 'all' | 'markdown' | 'images' | 'audio' | 'data';
export type CommunitySortBy = 'popular' | 'recent' | 'trending' | 'featured';

interface DataSourceTabsProps {
  samples: SampleDatasetSummary[];
  isLoadingSamples: boolean;
  activeDatasetId?: string;
  onLoadSample: (filename: string) => Promise<void>;
  isProcessing: boolean;
  codexRepo?: string;
  codexBranch?: string;
  codexPath?: string;
}

// ============================================================================
// Hierarchy Detection & Icons
// ============================================================================

/**
 * Determines the node type based on path depth and naming conventions
 * - weaves/ = top level = Weave
 * - weaves/xxx/looms/ = Loom
 * - weaves/xxx/strands/ or any file = Strand
 */
const getNodeType = (path: string, isDir: boolean, depth: number): NodeType => {
  const parts = path.split('/').filter(Boolean);
  
  if (!isDir) return 'strand';
  
  // Check for special directory names
  const name = parts[parts.length - 1]?.toLowerCase();
  
  if (name === 'weaves' || depth === 0) return 'weave';
  if (name === 'looms' || parts.includes('looms')) return 'loom';
  if (name === 'strands' || parts.includes('strands')) return 'strand';
  
  // Based on depth within weaves structure
  if (depth === 1) return 'weave'; // Direct children of weaves/
  if (depth === 2) return 'loom';  // Sub-folders
  
  return 'loom'; // Default for directories
};

const NODE_CONFIG: Record<NodeType, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  bgColor: string;
}> = {
  weave: { 
    icon: Layers, 
    label: 'Weave', 
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 dark:bg-purple-500/20'
  },
  loom: { 
    icon: Library, 
    label: 'Loom', 
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/10 dark:bg-blue-500/20'
  },
  strand: { 
    icon: ScrollText, 
    label: 'Strand', 
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20'
  },
  file: { 
    icon: FileText, 
    label: 'File', 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  dir: { 
    icon: FolderOpen, 
    label: 'Folder', 
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-500/20'
  },
};

const FILE_ICONS: Record<string, React.ElementType> = {
  markdown: FileText,
  image: ImageIcon,
  audio: Music,
  video: Video,
  json: FileJson,
  csv: FileSpreadsheet,
  code: FileCode,
  default: FileText,
};

const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['md', 'mdx', 'markdown'].includes(ext)) return 'markdown';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['json', 'jsonl'].includes(ext)) return 'json';
  if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext)) return 'csv';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rs', 'go'].includes(ext)) return 'code';
  return 'default';
};

const getFileIcon = (filename: string): React.ElementType => {
  const type = getFileType(filename);
  return FILE_ICONS[type] || FILE_ICONS.default;
};

const shouldShowFile = (filename: string, filter: FileFilter, gitignore: string[]): boolean => {
  for (const pattern of gitignore) {
    if (pattern.startsWith('!')) continue;
    const regex = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*'));
    if (regex.test(filename)) return false;
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

const formatName = (name: string): string => {
  // Remove file extension for display
  const withoutExt = name.replace(/\.(md|mdx|json|csv|tsx?|jsx?)$/i, '');
  // Convert kebab-case or snake_case to Title Case
  return withoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

// ============================================================================
// Tree Node Component
// ============================================================================

interface TreeNodeItemProps {
  node: TreeNode;
  filter: FileFilter;
  searchQuery: string;
  gitignore: string[];
  onSelect: (node: TreeNode) => void;
  onToggle: (path: string) => void;
  expandedPaths: Set<string>;
  isMobile: boolean;
}

function TreeNodeItem({
  node,
  filter,
  searchQuery,
  gitignore,
  onSelect,
  onToggle,
  expandedPaths,
  isMobile,
}: TreeNodeItemProps) {
  const isDir = node.type === 'dir';
  const isExpanded = expandedPaths.has(node.path);
  const config = isDir ? NODE_CONFIG[node.nodeType] : NODE_CONFIG.strand;
  const Icon = isDir ? config.icon : getFileIcon(node.name);
  
  // Filter check for files
  if (!isDir && !shouldShowFile(node.name, filter, gitignore)) {
    return null;
  }
  
  // Search filter
  if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
    // Still show if children might match
    if (!isDir || !node.children?.length) return null;
  }
  
  const handleClick = () => {
    if (isDir) {
      onToggle(node.path);
    } else {
      onSelect(node);
    }
  };

  return (
    <div className="select-none">
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 sm:py-2 rounded-lg transition-all text-left",
          "hover:bg-accent/50 active:bg-accent/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          // Touch-friendly sizing on mobile
          isMobile && "min-h-[44px]"
        )}
        style={{ paddingLeft: `${Math.max(8, node.depth * 12 + 8)}px` }}
      >
        {/* Expand/collapse indicator for directories */}
        {isDir && (
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </span>
        )}
        
        {/* Icon with colored background */}
        <span className={cn(
          "w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center flex-shrink-0",
          isDir ? config.bgColor : "bg-muted/50"
        )}>
          <Icon className={cn(
            "h-3.5 w-3.5 sm:h-4 sm:w-4",
            isDir ? config.color : "text-muted-foreground"
          )} />
        </span>
        
        {/* Name and type badge */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={cn(
            "text-xs sm:text-sm truncate",
            isDir && "font-medium"
          )}>
            {formatName(node.name)}
          </span>
          
          {/* Node type badge - hidden on very small screens */}
          {isDir && (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-[9px] sm:text-[10px] h-4 px-1.5 hidden xs:inline-flex",
                config.bgColor,
                config.color
              )}
            >
              {config.label}
            </Badge>
          )}
        </div>
        
        {/* File size for files */}
        {!isDir && node.size && (
          <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
            {formatFileSize(node.size)}
          </span>
        )}
        
        {/* Children count for directories */}
        {isDir && node.children && (
          <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
            {node.children.length}
          </span>
        )}
      </button>
      
      {/* Children */}
      {isDir && isExpanded && node.children && (
        <div className="border-l border-border/30 ml-4 sm:ml-5">
          {node.children
            .sort((a, b) => {
              if (a.type === 'dir' && b.type !== 'dir') return -1;
              if (a.type !== 'dir' && b.type === 'dir') return 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                filter={filter}
                searchQuery={searchQuery}
                gitignore={gitignore}
                onSelect={onSelect}
                onToggle={onToggle}
                expandedPaths={expandedPaths}
                isMobile={isMobile}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Repository Browser with Tree
// ============================================================================

interface RepoBrowserProps {
  repo: string;
  branch: string;
  basePath: string;
  filter: FileFilter;
  searchQuery: string;
  onFileSelect: (node: TreeNode) => void;
}

function RepoBrowser({ repo, branch, basePath, filter, searchQuery, onFileSelect }: RepoBrowserProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([basePath]));
  const [isMobile, setIsMobile] = useState(false);
  
  const gitignore = useMemo(() => [
    'node_modules', '.git', '.DS_Store', '*.log', 'dist', 'build', '.next', '__pycache__'
  ], []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Recursive fetch function
  const fetchTree = useCallback(async (path: string, depth: number = 0): Promise<TreeNode[]> => {
    const url = `https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const items = await response.json();
    if (!Array.isArray(items)) return [];
    
    const nodes: TreeNode[] = [];
    
    for (const item of items) {
      // Skip gitignored files
      if (gitignore.some(p => item.name.match(new RegExp(p.replace(/\*/g, '.*'))))) {
        continue;
      }
      
      const isDir = item.type === 'dir';
      const nodeType = getNodeType(item.path, isDir, depth);
      
      const node: TreeNode = {
        name: item.name,
        path: item.path,
        type: item.type,
        nodeType,
        size: item.size,
        sha: item.sha,
        url: item.html_url,
        download_url: item.download_url,
        depth,
        children: isDir ? [] : undefined,
      };
      
      // Recursively fetch children for directories (limit depth to avoid rate limits)
      if (isDir && depth < 3) {
        try {
          node.children = await fetchTree(item.path, depth + 1);
        } catch {
          node.children = [];
        }
      }
      
      nodes.push(node);
    }
    
    return nodes;
  }, [repo, branch, gitignore]);

  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nodes = await fetchTree(basePath);
        if (!cancelled) {
          setTree(nodes);
          // Auto-expand first level
          const firstLevelPaths = nodes.filter(n => n.type === 'dir').map(n => n.path);
          setExpandedPaths(new Set([basePath, ...firstLevelPaths]));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [basePath, fetchTree]);

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mb-3" />
        <span className="text-xs sm:text-sm">Loading repository...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
        <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 mb-3 text-destructive/60" />
        <p className="text-xs sm:text-sm text-center mb-3">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Legend - collapsible on mobile */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 pb-2 border-b border-border/50">
        {(['weave', 'loom', 'strand'] as const).map((type) => {
          const config = NODE_CONFIG[type];
          const Icon = config.icon;
          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs",
                  config.bgColor,
                  config.color
                )}>
                  <Icon className="h-3 w-3" />
                  <span className="hidden xs:inline">{config.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">
                  {type === 'weave' && 'Top-level collection (e.g., wiki, frame)'}
                  {type === 'loom' && 'Sub-collection within a weave'}
                  {type === 'strand' && 'Individual document or file'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Tree */}
      <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto -mx-2 px-2">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
          </div>
        ) : (
          tree
            .sort((a, b) => {
              if (a.type === 'dir' && b.type !== 'dir') return -1;
              if (a.type !== 'dir' && b.type === 'dir') return 1;
              return a.name.localeCompare(b.name);
            })
            .map((node) => (
              <TreeNodeItem
                key={node.path}
                node={node}
                filter={filter}
                searchQuery={searchQuery}
                gitignore={gitignore}
                onSelect={onFileSelect}
                onToggle={handleToggle}
                expandedPaths={expandedPaths}
                isMobile={isMobile}
              />
            ))
        )}
      </div>
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

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setItems([
        {
          id: '1',
          title: 'Sales Performance Dashboard',
          description: 'Interactive visualization of Q4 sales metrics',
          type: 'visualization',
          author: { id: 'u1', name: 'DataWiz' },
          votes: { up: 142, down: 8 },
          views: 2340,
          downloads: 89,
          createdAt: '2024-01-15T10:00:00Z',
          featured: true,
          tags: ['sales', 'dashboard'],
        },
        {
          id: '2',
          title: 'Global Climate Dataset 2024',
          description: 'Comprehensive climate data from 195 countries',
          type: 'dataset',
          author: { id: 'u2', name: 'ClimateResearch' },
          votes: { up: 89, down: 3 },
          views: 1520,
          downloads: 234,
          createdAt: '2024-01-14T15:30:00Z',
          tags: ['climate', 'environment'],
        },
        {
          id: '3',
          title: 'Machine Learning Cheatsheet',
          description: 'Quick reference guide for ML algorithms',
          type: 'document',
          author: { id: 'u3', name: 'MLMaster' },
          votes: { up: 256, down: 12 },
          views: 5680,
          downloads: 1203,
          createdAt: '2024-01-10T08:00:00Z',
          featured: true,
          tags: ['ml', 'reference'],
        },
      ]);
      setLoading(false);
    }, 500);
  }, [sortBy]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'popular': return (b.votes.up - b.votes.down) - (a.votes.up - a.votes.down);
        case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'trending': return (b.votes.up + b.views / 10) - (a.votes.up + a.views / 10);
        case 'featured': return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        default: return 0;
      }
    });
  }, [items, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sort - responsive */}
      <Select value={sortBy} onValueChange={(v) => onSortChange(v as CommunitySortBy)}>
        <SelectTrigger className="h-8 text-xs w-full sm:w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="featured"><Star className="h-3 w-3 mr-1.5 inline" />Featured</SelectItem>
          <SelectItem value="popular"><ThumbsUp className="h-3 w-3 mr-1.5 inline" />Popular</SelectItem>
          <SelectItem value="recent"><Clock className="h-3 w-3 mr-1.5 inline" />Recent</SelectItem>
          <SelectItem value="trending"><TrendingUp className="h-3 w-3 mr-1.5 inline" />Trending</SelectItem>
        </SelectContent>
      </Select>

      {/* Items - responsive cards */}
      <div className="space-y-2 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
        {sortedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(item)}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all min-h-[70px]",
              "hover:border-primary/30 hover:bg-accent/30 active:bg-accent/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{item.title}</span>
                  {item.featured && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary">
                      Featured
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[10px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" />{item.votes.up}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />{item.views}
                  </span>
                  <span className="hidden sm:flex items-center gap-1">
                    <Download className="h-3 w-3" />{item.downloads}
                  </span>
                  <span className="hidden xs:inline">by {item.author.name}</span>
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

  const handleCodexFileSelect = useCallback((node: TreeNode) => {
    if (node.download_url) {
      window.open(node.download_url, '_blank');
    } else if (node.url) {
      window.open(node.url, '_blank');
    }
  }, []);

  const handleCommunityItemSelect = useCallback((item: CommunityItem) => {
    console.log('Selected:', item);
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          {/* Tabs - responsive */}
          <TabsList className="grid grid-cols-3 h-9 sm:h-10 bg-muted/50">
            <TabsTrigger value="datasets" className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-1 sm:px-3">
              <Database className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Datasets</span>
              <span className="xs:hidden">Data</span>
            </TabsTrigger>
            <TabsTrigger value="codex" className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-1 sm:px-3">
              <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Codex</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="text-[10px] sm:text-xs gap-1 sm:gap-1.5 px-1 sm:px-3">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden xs:inline">Community</span>
              <span className="xs:hidden">Feed</span>
            </TabsTrigger>
          </TabsList>

          {/* Search & Filter - responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 sm:h-8 pl-8 text-sm sm:text-xs"
              />
            </div>
            
            {activeTab === 'codex' && (
              <Select value={fileFilter} onValueChange={(v) => setFileFilter(v as FileFilter)}>
                <SelectTrigger className="h-9 sm:h-8 w-full sm:w-[110px] text-sm sm:text-xs">
                  <Filter className="h-3 w-3 mr-1.5" />
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
          <TabsContent value="datasets" className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                CSV, JSON, and visualization-ready data
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">For creating charts, graphs, and data visualizations.</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto space-y-2">
              {isLoadingSamples ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : samples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No datasets available</p>
                </div>
              ) : (
                samples
                  .filter(s => !searchQuery || s.filename.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((sample) => {
                    const isActive = activeDatasetId === sample.id;
                    return (
                      <button
                        key={sample.id}
                        onClick={() => onLoadSample(sample.filename)}
                        disabled={isProcessing}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left min-h-[60px]",
                          "hover:border-primary/30 hover:bg-accent/30 active:bg-accent/50",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          isActive && "border-primary bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">{sample.filename}</span>
                            {isActive && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Active</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{sample.rowCount?.toLocaleString() || '?'} rows</span>
                            <span>•</span>
                            <span>{sample.columnCount || '?'} cols</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </TabsContent>

          {/* Codex Tab */}
          <TabsContent value="codex" className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span className="truncate max-w-[150px] sm:max-w-none">{codexRepo}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`https://github.com/${codexRepo}/tree/${codexBranch}/${codexPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Open in GitHub</p></TooltipContent>
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
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Community uploads & featured content
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">Vote on favorites and discover trending visualizations.</p>
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
