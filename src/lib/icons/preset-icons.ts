/**
 * @module preset-icons
 * @description Curated icon registry for OpenStrand entities
 * 
 * Provides a comprehensive set of Lucide icons organized by category
 * with helper functions for retrieval and search.
 */

import {
  // General
  Folder,
  FileText,
  File,
  Files,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderCheck,
  // Knowledge
  Book,
  BookOpen,
  BookMarked,
  Library,
  GraduationCap,
  Brain,
  Lightbulb,
  Sparkles,
  // Data
  Database,
  Table,
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  Activity,
  // Code
  Code,
  Code2,
  Terminal,
  Braces,
  FileCode,
  // Media
  Image,
  Video,
  Music,
  Camera,
  Mic,
  // Communication
  MessageSquare,
  Mail,
  Send,
  Share2,
  // Organization
  Layers,
  Grid,
  List,
  Layout,
  Columns,
  // Status
  CheckCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Clock,
  // Actions
  Plus,
  Minus,
  Edit,
  Trash,
  Search,
  Filter,
  // Navigation
  Home,
  Settings,
  User,
  Users,
  // Science
  Atom,
  Flask,
  Microscope,
  Dna,
  // Business
  Briefcase,
  Building,
  DollarSign,
  CreditCard,
  // Creative
  Palette,
  Pen,
  Pencil,
  Brush,
  // Nature
  Leaf,
  Sun,
  Moon,
  Cloud,
  // Tech
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  // Misc
  Star,
  Heart,
  Flag,
  Bookmark,
  Tag,
  Hash,
  Link,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type IconCategory = 
  | 'general'
  | 'knowledge'
  | 'data'
  | 'code'
  | 'media'
  | 'communication'
  | 'organization'
  | 'status'
  | 'actions'
  | 'navigation'
  | 'science'
  | 'business'
  | 'creative'
  | 'nature'
  | 'tech'
  | 'misc';

export interface PresetIcon {
  id: string;
  name: string;
  icon: LucideIcon;
  category: IconCategory;
  keywords: string[];
}

// ============================================================================
// Icon Registry
// ============================================================================

export const ICON_CATEGORIES: IconCategory[] = [
  'general',
  'knowledge',
  'data',
  'code',
  'media',
  'communication',
  'organization',
  'status',
  'actions',
  'navigation',
  'science',
  'business',
  'creative',
  'nature',
  'tech',
  'misc',
];

export const PRESET_ICONS: PresetIcon[] = [
  // General
  { id: 'folder', name: 'Folder', icon: Folder, category: 'general', keywords: ['directory', 'container'] },
  { id: 'folder-open', name: 'Folder Open', icon: FolderOpen, category: 'general', keywords: ['directory', 'open'] },
  { id: 'folder-plus', name: 'Folder Plus', icon: FolderPlus, category: 'general', keywords: ['add', 'new'] },
  { id: 'file', name: 'File', icon: File, category: 'general', keywords: ['document'] },
  { id: 'file-text', name: 'File Text', icon: FileText, category: 'general', keywords: ['document', 'text'] },
  { id: 'files', name: 'Files', icon: Files, category: 'general', keywords: ['multiple', 'documents'] },
  
  // Knowledge
  { id: 'book', name: 'Book', icon: Book, category: 'knowledge', keywords: ['reading', 'learn'] },
  { id: 'book-open', name: 'Book Open', icon: BookOpen, category: 'knowledge', keywords: ['reading', 'study'] },
  { id: 'book-marked', name: 'Book Marked', icon: BookMarked, category: 'knowledge', keywords: ['bookmark', 'saved'] },
  { id: 'library', name: 'Library', icon: Library, category: 'knowledge', keywords: ['books', 'collection'] },
  { id: 'graduation-cap', name: 'Graduation Cap', icon: GraduationCap, category: 'knowledge', keywords: ['education', 'degree'] },
  { id: 'brain', name: 'Brain', icon: Brain, category: 'knowledge', keywords: ['think', 'mind', 'ai'] },
  { id: 'lightbulb', name: 'Lightbulb', icon: Lightbulb, category: 'knowledge', keywords: ['idea', 'insight'] },
  { id: 'sparkles', name: 'Sparkles', icon: Sparkles, category: 'knowledge', keywords: ['magic', 'ai', 'new'] },
  
  // Data
  { id: 'database', name: 'Database', icon: Database, category: 'data', keywords: ['storage', 'data'] },
  { id: 'table', name: 'Table', icon: Table, category: 'data', keywords: ['grid', 'spreadsheet'] },
  { id: 'bar-chart', name: 'Bar Chart', icon: BarChart, category: 'data', keywords: ['visualization', 'stats'] },
  { id: 'line-chart', name: 'Line Chart', icon: LineChart, category: 'data', keywords: ['trend', 'graph'] },
  { id: 'pie-chart', name: 'Pie Chart', icon: PieChart, category: 'data', keywords: ['percentage', 'distribution'] },
  { id: 'trending-up', name: 'Trending Up', icon: TrendingUp, category: 'data', keywords: ['growth', 'increase'] },
  { id: 'activity', name: 'Activity', icon: Activity, category: 'data', keywords: ['pulse', 'metrics'] },
  
  // Code
  { id: 'code', name: 'Code', icon: Code, category: 'code', keywords: ['programming', 'development'] },
  { id: 'code-2', name: 'Code 2', icon: Code2, category: 'code', keywords: ['programming', 'brackets'] },
  { id: 'terminal', name: 'Terminal', icon: Terminal, category: 'code', keywords: ['console', 'cli'] },
  { id: 'braces', name: 'Braces', icon: Braces, category: 'code', keywords: ['json', 'object'] },
  { id: 'file-code', name: 'File Code', icon: FileCode, category: 'code', keywords: ['source', 'script'] },
  
  // Media
  { id: 'image', name: 'Image', icon: Image, category: 'media', keywords: ['photo', 'picture'] },
  { id: 'video', name: 'Video', icon: Video, category: 'media', keywords: ['movie', 'film'] },
  { id: 'music', name: 'Music', icon: Music, category: 'media', keywords: ['audio', 'song'] },
  { id: 'camera', name: 'Camera', icon: Camera, category: 'media', keywords: ['photo', 'capture'] },
  { id: 'mic', name: 'Microphone', icon: Mic, category: 'media', keywords: ['audio', 'voice', 'record'] },
  
  // Communication
  { id: 'message', name: 'Message', icon: MessageSquare, category: 'communication', keywords: ['chat', 'comment'] },
  { id: 'mail', name: 'Mail', icon: Mail, category: 'communication', keywords: ['email', 'letter'] },
  { id: 'send', name: 'Send', icon: Send, category: 'communication', keywords: ['submit', 'share'] },
  { id: 'share', name: 'Share', icon: Share2, category: 'communication', keywords: ['distribute', 'social'] },
  
  // Organization
  { id: 'layers', name: 'Layers', icon: Layers, category: 'organization', keywords: ['stack', 'levels'] },
  { id: 'grid', name: 'Grid', icon: Grid, category: 'organization', keywords: ['layout', 'matrix'] },
  { id: 'list', name: 'List', icon: List, category: 'organization', keywords: ['items', 'bullet'] },
  { id: 'layout', name: 'Layout', icon: Layout, category: 'organization', keywords: ['template', 'design'] },
  { id: 'columns', name: 'Columns', icon: Columns, category: 'organization', keywords: ['side-by-side', 'compare'] },
  
  // Status
  { id: 'check-circle', name: 'Check Circle', icon: CheckCircle, category: 'status', keywords: ['done', 'complete', 'success'] },
  { id: 'alert-circle', name: 'Alert Circle', icon: AlertCircle, category: 'status', keywords: ['warning', 'attention'] },
  { id: 'info', name: 'Info', icon: Info, category: 'status', keywords: ['information', 'help'] },
  { id: 'help-circle', name: 'Help Circle', icon: HelpCircle, category: 'status', keywords: ['question', 'support'] },
  { id: 'clock', name: 'Clock', icon: Clock, category: 'status', keywords: ['time', 'schedule'] },
  
  // Actions
  { id: 'plus', name: 'Plus', icon: Plus, category: 'actions', keywords: ['add', 'new', 'create'] },
  { id: 'minus', name: 'Minus', icon: Minus, category: 'actions', keywords: ['remove', 'subtract'] },
  { id: 'edit', name: 'Edit', icon: Edit, category: 'actions', keywords: ['modify', 'change'] },
  { id: 'trash', name: 'Trash', icon: Trash, category: 'actions', keywords: ['delete', 'remove'] },
  { id: 'search', name: 'Search', icon: Search, category: 'actions', keywords: ['find', 'lookup'] },
  { id: 'filter', name: 'Filter', icon: Filter, category: 'actions', keywords: ['sort', 'refine'] },
  
  // Navigation
  { id: 'home', name: 'Home', icon: Home, category: 'navigation', keywords: ['main', 'start'] },
  { id: 'settings', name: 'Settings', icon: Settings, category: 'navigation', keywords: ['config', 'preferences'] },
  { id: 'user', name: 'User', icon: User, category: 'navigation', keywords: ['profile', 'account'] },
  { id: 'users', name: 'Users', icon: Users, category: 'navigation', keywords: ['team', 'group'] },
  
  // Science
  { id: 'atom', name: 'Atom', icon: Atom, category: 'science', keywords: ['physics', 'molecule'] },
  { id: 'flask', name: 'Flask', icon: Flask, category: 'science', keywords: ['chemistry', 'experiment'] },
  { id: 'microscope', name: 'Microscope', icon: Microscope, category: 'science', keywords: ['biology', 'research'] },
  { id: 'dna', name: 'DNA', icon: Dna, category: 'science', keywords: ['genetics', 'biology'] },
  
  // Business
  { id: 'briefcase', name: 'Briefcase', icon: Briefcase, category: 'business', keywords: ['work', 'job'] },
  { id: 'building', name: 'Building', icon: Building, category: 'business', keywords: ['company', 'office'] },
  { id: 'dollar-sign', name: 'Dollar Sign', icon: DollarSign, category: 'business', keywords: ['money', 'finance'] },
  { id: 'credit-card', name: 'Credit Card', icon: CreditCard, category: 'business', keywords: ['payment', 'billing'] },
  
  // Creative
  { id: 'palette', name: 'Palette', icon: Palette, category: 'creative', keywords: ['art', 'design', 'colors'] },
  { id: 'pen', name: 'Pen', icon: Pen, category: 'creative', keywords: ['write', 'draw'] },
  { id: 'pencil', name: 'Pencil', icon: Pencil, category: 'creative', keywords: ['sketch', 'draft'] },
  { id: 'brush', name: 'Brush', icon: Brush, category: 'creative', keywords: ['paint', 'art'] },
  
  // Nature
  { id: 'leaf', name: 'Leaf', icon: Leaf, category: 'nature', keywords: ['plant', 'eco', 'green'] },
  { id: 'sun', name: 'Sun', icon: Sun, category: 'nature', keywords: ['light', 'day'] },
  { id: 'moon', name: 'Moon', icon: Moon, category: 'nature', keywords: ['night', 'dark'] },
  { id: 'cloud', name: 'Cloud', icon: Cloud, category: 'nature', keywords: ['weather', 'sky'] },
  
  // Tech
  { id: 'cpu', name: 'CPU', icon: Cpu, category: 'tech', keywords: ['processor', 'computer'] },
  { id: 'hard-drive', name: 'Hard Drive', icon: HardDrive, category: 'tech', keywords: ['storage', 'disk'] },
  { id: 'wifi', name: 'WiFi', icon: Wifi, category: 'tech', keywords: ['network', 'internet'] },
  { id: 'globe', name: 'Globe', icon: Globe, category: 'tech', keywords: ['world', 'web', 'internet'] },
  
  // Misc
  { id: 'star', name: 'Star', icon: Star, category: 'misc', keywords: ['favorite', 'rating'] },
  { id: 'heart', name: 'Heart', icon: Heart, category: 'misc', keywords: ['love', 'like'] },
  { id: 'flag', name: 'Flag', icon: Flag, category: 'misc', keywords: ['mark', 'important'] },
  { id: 'bookmark', name: 'Bookmark', icon: Bookmark, category: 'misc', keywords: ['save', 'mark'] },
  { id: 'tag', name: 'Tag', icon: Tag, category: 'misc', keywords: ['label', 'category'] },
  { id: 'hash', name: 'Hash', icon: Hash, category: 'misc', keywords: ['number', 'hashtag'] },
  { id: 'link', name: 'Link', icon: Link, category: 'misc', keywords: ['url', 'connection'] },
  { id: 'external-link', name: 'External Link', icon: ExternalLink, category: 'misc', keywords: ['open', 'new tab'] },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a preset icon by ID
 */
export function getPresetIcon(id: string): PresetIcon | undefined {
  return PRESET_ICONS.find(icon => icon.id === id);
}

/**
 * Get the default icon for Looms
 */
export function getDefaultLoomIcon(): PresetIcon {
  return PRESET_ICONS.find(icon => icon.id === 'layers') || PRESET_ICONS[0];
}

/**
 * Get the default icon for Weaves
 */
export function getDefaultWeaveIcon(): PresetIcon {
  return PRESET_ICONS.find(icon => icon.id === 'grid') || PRESET_ICONS[0];
}

/**
 * Get icons by category
 */
export function getIconsByCategory(category: IconCategory): PresetIcon[] {
  return PRESET_ICONS.filter(icon => icon.category === category);
}

/**
 * Search icons by name or keywords
 */
export function searchIcons(query: string): PresetIcon[] {
  const lowerQuery = query.toLowerCase();
  return PRESET_ICONS.filter(icon =>
    icon.name.toLowerCase().includes(lowerQuery) ||
    icon.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get recommended icons for a specific use case
 */
export function getRecommendedIconsForUseCase(
  useCase: 'loom' | 'weave' | 'strand' | 'folder' | 'general'
): PresetIcon[] {
  switch (useCase) {
    case 'loom':
      return PRESET_ICONS.filter(icon =>
        ['layers', 'grid', 'library', 'briefcase', 'folder', 'database'].includes(icon.id)
      );
    case 'weave':
      return PRESET_ICONS.filter(icon =>
        ['grid', 'layers', 'layout', 'columns', 'table', 'list'].includes(icon.id)
      );
    case 'strand':
      return PRESET_ICONS.filter(icon =>
        ['file-text', 'book', 'lightbulb', 'code', 'image', 'message'].includes(icon.id)
      );
    case 'folder':
      return PRESET_ICONS.filter(icon =>
        ['folder', 'folder-open', 'folder-plus', 'layers', 'library', 'book'].includes(icon.id)
      );
    case 'general':
    default:
      return PRESET_ICONS.slice(0, 20);
  }
}

