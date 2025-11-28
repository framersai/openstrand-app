/**
 * Preset Icon Registry for OpenStrand
 * 
 * Provides a curated list of accessible, ARIA-compliant icons from Lucide
 * for use in Looms, Weaves, folders, and other entities.
 * 
 * Icons are organized by category for easy selection in the UI.
 * Each icon has a unique identifier, display name, and accessibility label.
 * 
 * @module lib/icons/preset-icons
 */

import type { LucideIcon } from 'lucide-react';
import {
  // Default/General
  Folder,
  FolderOpen,
  FolderTree,
  File,
  FileText,
  Files,
  
  // Knowledge & Research
  Book,
  BookOpen,
  BookMarked,
  Library,
  GraduationCap,
  School,
  Lightbulb,
  Brain,
  Atom,
  Microscope,
  FlaskConical,
  TestTube,
  Dna,
  
  // Creative & Writing
  Pen,
  PenTool,
  Pencil,
  Feather,
  Scroll,
  NotebookPen,
  FileEdit,
  Quote,
  Type,
  
  // Storytelling & Narrative
  Drama,
  Clapperboard,
  Film,
  Camera,
  Video,
  Tv,
  Radio,
  Mic,
  Music,
  Music2,
  Music4,
  
  // World-building & Fantasy
  Castle,
  Crown,
  Swords,
  Shield,
  Wand2,
  Sparkles,
  Star,
  Moon,
  Sun,
  Mountain,
  Trees,
  Palmtree,
  Flower,
  Leaf,
  
  // Technology & Code
  Code,
  Code2,
  Terminal,
  Cpu,
  Server,
  Database,
  HardDrive,
  Cloud,
  Globe,
  Wifi,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  
  // Data & Analytics
  BarChart,
  BarChart2,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Activity,
  Gauge,
  Target,
  
  // Organization & Planning
  Calendar,
  CalendarDays,
  Clock,
  Timer,
  Hourglass,
  ListTodo,
  CheckSquare,
  ClipboardList,
  Kanban,
  Layout,
  LayoutGrid,
  Grid3X3,
  
  // Communication
  MessageSquare,
  MessageCircle,
  Mail,
  Send,
  Bell,
  Megaphone,
  
  // Business & Finance
  Briefcase,
  Building,
  Building2,
  Landmark,
  Wallet,
  CreditCard,
  DollarSign,
  PiggyBank,
  Receipt,
  
  // People & Teams
  User,
  Users,
  UserCircle,
  UserPlus,
  UsersRound,
  Heart,
  HeartHandshake,
  Handshake,
  
  // Nature & Science
  Bug,
  Bird,
  Cat,
  Dog,
  Fish,
  Rabbit,
  Squirrel,
  TreeDeciduous,
  TreePine,
  Sprout,
  
  // Travel & Places
  Map,
  MapPin,
  Compass,
  Navigation,
  Plane,
  Car,
  Ship,
  Train,
  Rocket,
  
  // Health & Wellness
  HeartPulse,
  Stethoscope,
  Pill,
  Apple,
  Salad,
  Dumbbell,
  PersonStanding,
  
  // Art & Design
  Palette,
  Brush,
  Paintbrush,
  Scissors,
  Shapes,
  Circle,
  Square,
  Triangle,
  Hexagon,
  
  // Games & Fun
  Gamepad2,
  Dice5,
  Puzzle,
  Trophy,
  Medal,
  Award,
  Gift,
  PartyPopper,
  
  // Security & Privacy
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Fingerprint,
  Eye,
  EyeOff,
  
  // Misc Useful
  Box,
  Package,
  Archive,
  Bookmark,
  Tag,
  Tags,
  Hash,
  Link,
  Anchor,
  Infinity,
  Zap,
  Flame,
  Snowflake,
  Umbrella,
  Coffee,
  Wine,
  Utensils,
  Home,
  Store,
  Factory,
  Warehouse,
} from 'lucide-react';

/**
 * Icon category for organizing preset icons
 */
export type IconCategory =
  | 'default'
  | 'knowledge'
  | 'creative'
  | 'storytelling'
  | 'worldbuilding'
  | 'technology'
  | 'data'
  | 'organization'
  | 'communication'
  | 'business'
  | 'people'
  | 'nature'
  | 'travel'
  | 'health'
  | 'art'
  | 'games'
  | 'security'
  | 'misc';

/**
 * Preset icon definition
 */
export interface PresetIcon {
  /** Unique identifier for the icon (used in DB) */
  id: string;
  /** Display name for the icon */
  name: string;
  /** The Lucide icon component */
  icon: LucideIcon;
  /** Category for organization */
  category: IconCategory;
  /** Accessibility label for screen readers */
  ariaLabel: string;
  /** Optional keywords for search */
  keywords?: string[];
}

/**
 * Category metadata
 */
export interface IconCategoryMeta {
  id: IconCategory;
  name: string;
  description: string;
}

/**
 * Category definitions with metadata
 */
export const ICON_CATEGORIES: IconCategoryMeta[] = [
  { id: 'default', name: 'Default', description: 'Basic folder and file icons' },
  { id: 'knowledge', name: 'Knowledge & Research', description: 'Academic and research icons' },
  { id: 'creative', name: 'Creative & Writing', description: 'Writing and content creation' },
  { id: 'storytelling', name: 'Storytelling', description: 'Media and narrative icons' },
  { id: 'worldbuilding', name: 'World-building', description: 'Fantasy and world creation' },
  { id: 'technology', name: 'Technology', description: 'Tech and development icons' },
  { id: 'data', name: 'Data & Analytics', description: 'Charts and data visualization' },
  { id: 'organization', name: 'Organization', description: 'Planning and productivity' },
  { id: 'communication', name: 'Communication', description: 'Messaging and notifications' },
  { id: 'business', name: 'Business', description: 'Business and finance icons' },
  { id: 'people', name: 'People & Teams', description: 'Users and collaboration' },
  { id: 'nature', name: 'Nature & Science', description: 'Nature and biology' },
  { id: 'travel', name: 'Travel & Places', description: 'Maps and transportation' },
  { id: 'health', name: 'Health & Wellness', description: 'Health and fitness' },
  { id: 'art', name: 'Art & Design', description: 'Design and creativity' },
  { id: 'games', name: 'Games & Fun', description: 'Gaming and entertainment' },
  { id: 'security', name: 'Security', description: 'Privacy and security' },
  { id: 'misc', name: 'Miscellaneous', description: 'Other useful icons' },
];

/**
 * Complete preset icon registry
 */
export const PRESET_ICONS: PresetIcon[] = [
  // Default/General
  { id: 'folder', name: 'Folder', icon: Folder, category: 'default', ariaLabel: 'Folder icon', keywords: ['directory', 'container'] },
  { id: 'folder-open', name: 'Folder Open', icon: FolderOpen, category: 'default', ariaLabel: 'Open folder icon', keywords: ['directory', 'expanded'] },
  { id: 'folder-tree', name: 'Folder Tree', icon: FolderTree, category: 'default', ariaLabel: 'Folder tree icon', keywords: ['hierarchy', 'structure'] },
  { id: 'file', name: 'File', icon: File, category: 'default', ariaLabel: 'File icon', keywords: ['document'] },
  { id: 'file-text', name: 'File Text', icon: FileText, category: 'default', ariaLabel: 'Text file icon', keywords: ['document', 'text'] },
  { id: 'files', name: 'Files', icon: Files, category: 'default', ariaLabel: 'Multiple files icon', keywords: ['documents', 'collection'] },

  // Knowledge & Research
  { id: 'book', name: 'Book', icon: Book, category: 'knowledge', ariaLabel: 'Book icon', keywords: ['reading', 'literature'] },
  { id: 'book-open', name: 'Book Open', icon: BookOpen, category: 'knowledge', ariaLabel: 'Open book icon', keywords: ['reading', 'study'] },
  { id: 'book-marked', name: 'Bookmarked', icon: BookMarked, category: 'knowledge', ariaLabel: 'Bookmarked book icon', keywords: ['saved', 'reference'] },
  { id: 'library', name: 'Library', icon: Library, category: 'knowledge', ariaLabel: 'Library icon', keywords: ['collection', 'archive'] },
  { id: 'graduation-cap', name: 'Graduation Cap', icon: GraduationCap, category: 'knowledge', ariaLabel: 'Graduation cap icon', keywords: ['education', 'academic'] },
  { id: 'school', name: 'School', icon: School, category: 'knowledge', ariaLabel: 'School icon', keywords: ['education', 'learning'] },
  { id: 'lightbulb', name: 'Lightbulb', icon: Lightbulb, category: 'knowledge', ariaLabel: 'Lightbulb icon', keywords: ['idea', 'insight'] },
  { id: 'brain', name: 'Brain', icon: Brain, category: 'knowledge', ariaLabel: 'Brain icon', keywords: ['thinking', 'intelligence', 'ai'] },
  { id: 'atom', name: 'Atom', icon: Atom, category: 'knowledge', ariaLabel: 'Atom icon', keywords: ['science', 'physics'] },
  { id: 'microscope', name: 'Microscope', icon: Microscope, category: 'knowledge', ariaLabel: 'Microscope icon', keywords: ['research', 'science'] },
  { id: 'flask', name: 'Flask', icon: FlaskConical, category: 'knowledge', ariaLabel: 'Flask icon', keywords: ['chemistry', 'experiment'] },
  { id: 'test-tube', name: 'Test Tube', icon: TestTube, category: 'knowledge', ariaLabel: 'Test tube icon', keywords: ['experiment', 'lab'] },
  { id: 'dna', name: 'DNA', icon: Dna, category: 'knowledge', ariaLabel: 'DNA icon', keywords: ['genetics', 'biology'] },

  // Creative & Writing
  { id: 'pen', name: 'Pen', icon: Pen, category: 'creative', ariaLabel: 'Pen icon', keywords: ['write', 'edit'] },
  { id: 'pen-tool', name: 'Pen Tool', icon: PenTool, category: 'creative', ariaLabel: 'Pen tool icon', keywords: ['design', 'draw'] },
  { id: 'pencil', name: 'Pencil', icon: Pencil, category: 'creative', ariaLabel: 'Pencil icon', keywords: ['write', 'sketch'] },
  { id: 'feather', name: 'Feather', icon: Feather, category: 'creative', ariaLabel: 'Feather icon', keywords: ['write', 'quill'] },
  { id: 'scroll', name: 'Scroll', icon: Scroll, category: 'creative', ariaLabel: 'Scroll icon', keywords: ['document', 'ancient'] },
  { id: 'notebook', name: 'Notebook', icon: NotebookPen, category: 'creative', ariaLabel: 'Notebook icon', keywords: ['notes', 'journal'] },
  { id: 'file-edit', name: 'File Edit', icon: FileEdit, category: 'creative', ariaLabel: 'Edit file icon', keywords: ['document', 'modify'] },
  { id: 'quote', name: 'Quote', icon: Quote, category: 'creative', ariaLabel: 'Quote icon', keywords: ['citation', 'text'] },
  { id: 'type', name: 'Type', icon: Type, category: 'creative', ariaLabel: 'Typography icon', keywords: ['text', 'font'] },

  // Storytelling & Narrative
  { id: 'drama', name: 'Drama', icon: Drama, category: 'storytelling', ariaLabel: 'Drama masks icon', keywords: ['theater', 'acting'] },
  { id: 'clapperboard', name: 'Clapperboard', icon: Clapperboard, category: 'storytelling', ariaLabel: 'Clapperboard icon', keywords: ['film', 'movie'] },
  { id: 'film', name: 'Film', icon: Film, category: 'storytelling', ariaLabel: 'Film icon', keywords: ['movie', 'video'] },
  { id: 'camera', name: 'Camera', icon: Camera, category: 'storytelling', ariaLabel: 'Camera icon', keywords: ['photo', 'capture'] },
  { id: 'video', name: 'Video', icon: Video, category: 'storytelling', ariaLabel: 'Video icon', keywords: ['movie', 'recording'] },
  { id: 'tv', name: 'TV', icon: Tv, category: 'storytelling', ariaLabel: 'Television icon', keywords: ['screen', 'broadcast'] },
  { id: 'radio', name: 'Radio', icon: Radio, category: 'storytelling', ariaLabel: 'Radio icon', keywords: ['broadcast', 'audio'] },
  { id: 'mic', name: 'Microphone', icon: Mic, category: 'storytelling', ariaLabel: 'Microphone icon', keywords: ['audio', 'podcast'] },
  { id: 'music', name: 'Music', icon: Music, category: 'storytelling', ariaLabel: 'Music icon', keywords: ['audio', 'song'] },
  { id: 'music2', name: 'Music Note', icon: Music2, category: 'storytelling', ariaLabel: 'Music note icon', keywords: ['audio', 'melody'] },
  { id: 'music4', name: 'Music Notes', icon: Music4, category: 'storytelling', ariaLabel: 'Music notes icon', keywords: ['audio', 'composition'] },

  // World-building & Fantasy
  { id: 'castle', name: 'Castle', icon: Castle, category: 'worldbuilding', ariaLabel: 'Castle icon', keywords: ['fantasy', 'medieval'] },
  { id: 'crown', name: 'Crown', icon: Crown, category: 'worldbuilding', ariaLabel: 'Crown icon', keywords: ['royalty', 'king'] },
  { id: 'swords', name: 'Swords', icon: Swords, category: 'worldbuilding', ariaLabel: 'Crossed swords icon', keywords: ['battle', 'combat'] },
  { id: 'shield', name: 'Shield', icon: Shield, category: 'worldbuilding', ariaLabel: 'Shield icon', keywords: ['defense', 'protection'] },
  { id: 'wand', name: 'Magic Wand', icon: Wand2, category: 'worldbuilding', ariaLabel: 'Magic wand icon', keywords: ['magic', 'spell'] },
  { id: 'sparkles', name: 'Sparkles', icon: Sparkles, category: 'worldbuilding', ariaLabel: 'Sparkles icon', keywords: ['magic', 'special'] },
  { id: 'star', name: 'Star', icon: Star, category: 'worldbuilding', ariaLabel: 'Star icon', keywords: ['celestial', 'favorite'] },
  { id: 'moon', name: 'Moon', icon: Moon, category: 'worldbuilding', ariaLabel: 'Moon icon', keywords: ['night', 'celestial'] },
  { id: 'sun', name: 'Sun', icon: Sun, category: 'worldbuilding', ariaLabel: 'Sun icon', keywords: ['day', 'celestial'] },
  { id: 'mountain', name: 'Mountain', icon: Mountain, category: 'worldbuilding', ariaLabel: 'Mountain icon', keywords: ['terrain', 'landscape'] },
  { id: 'trees', name: 'Trees', icon: Trees, category: 'worldbuilding', ariaLabel: 'Trees icon', keywords: ['forest', 'nature'] },
  { id: 'palmtree', name: 'Palm Tree', icon: Palmtree, category: 'worldbuilding', ariaLabel: 'Palm tree icon', keywords: ['tropical', 'beach'] },
  { id: 'flower', name: 'Flower', icon: Flower, category: 'worldbuilding', ariaLabel: 'Flower icon', keywords: ['nature', 'garden'] },
  { id: 'leaf', name: 'Leaf', icon: Leaf, category: 'worldbuilding', ariaLabel: 'Leaf icon', keywords: ['nature', 'plant'] },

  // Technology & Code
  { id: 'code', name: 'Code', icon: Code, category: 'technology', ariaLabel: 'Code icon', keywords: ['programming', 'development'] },
  { id: 'code2', name: 'Code Brackets', icon: Code2, category: 'technology', ariaLabel: 'Code brackets icon', keywords: ['programming', 'syntax'] },
  { id: 'terminal', name: 'Terminal', icon: Terminal, category: 'technology', ariaLabel: 'Terminal icon', keywords: ['command', 'shell'] },
  { id: 'cpu', name: 'CPU', icon: Cpu, category: 'technology', ariaLabel: 'CPU icon', keywords: ['processor', 'hardware'] },
  { id: 'server', name: 'Server', icon: Server, category: 'technology', ariaLabel: 'Server icon', keywords: ['backend', 'infrastructure'] },
  { id: 'database', name: 'Database', icon: Database, category: 'technology', ariaLabel: 'Database icon', keywords: ['data', 'storage'] },
  { id: 'hard-drive', name: 'Hard Drive', icon: HardDrive, category: 'technology', ariaLabel: 'Hard drive icon', keywords: ['storage', 'disk'] },
  { id: 'cloud', name: 'Cloud', icon: Cloud, category: 'technology', ariaLabel: 'Cloud icon', keywords: ['hosting', 'saas'] },
  { id: 'globe', name: 'Globe', icon: Globe, category: 'technology', ariaLabel: 'Globe icon', keywords: ['web', 'internet'] },
  { id: 'wifi', name: 'WiFi', icon: Wifi, category: 'technology', ariaLabel: 'WiFi icon', keywords: ['network', 'wireless'] },
  { id: 'laptop', name: 'Laptop', icon: Laptop, category: 'technology', ariaLabel: 'Laptop icon', keywords: ['computer', 'device'] },
  { id: 'monitor', name: 'Monitor', icon: Monitor, category: 'technology', ariaLabel: 'Monitor icon', keywords: ['screen', 'display'] },
  { id: 'smartphone', name: 'Smartphone', icon: Smartphone, category: 'technology', ariaLabel: 'Smartphone icon', keywords: ['mobile', 'phone'] },
  { id: 'tablet', name: 'Tablet', icon: Tablet, category: 'technology', ariaLabel: 'Tablet icon', keywords: ['device', 'ipad'] },

  // Data & Analytics
  { id: 'bar-chart', name: 'Bar Chart', icon: BarChart, category: 'data', ariaLabel: 'Bar chart icon', keywords: ['graph', 'statistics'] },
  { id: 'bar-chart-2', name: 'Bar Chart 2', icon: BarChart2, category: 'data', ariaLabel: 'Bar chart icon', keywords: ['graph', 'analytics'] },
  { id: 'bar-chart-3', name: 'Bar Chart 3', icon: BarChart3, category: 'data', ariaLabel: 'Horizontal bar chart icon', keywords: ['graph', 'horizontal'] },
  { id: 'pie-chart', name: 'Pie Chart', icon: PieChart, category: 'data', ariaLabel: 'Pie chart icon', keywords: ['graph', 'distribution'] },
  { id: 'line-chart', name: 'Line Chart', icon: LineChart, category: 'data', ariaLabel: 'Line chart icon', keywords: ['graph', 'trend'] },
  { id: 'trending-up', name: 'Trending Up', icon: TrendingUp, category: 'data', ariaLabel: 'Trending up icon', keywords: ['growth', 'increase'] },
  { id: 'activity', name: 'Activity', icon: Activity, category: 'data', ariaLabel: 'Activity icon', keywords: ['pulse', 'metrics'] },
  { id: 'gauge', name: 'Gauge', icon: Gauge, category: 'data', ariaLabel: 'Gauge icon', keywords: ['meter', 'performance'] },
  { id: 'target', name: 'Target', icon: Target, category: 'data', ariaLabel: 'Target icon', keywords: ['goal', 'objective'] },

  // Organization & Planning
  { id: 'calendar', name: 'Calendar', icon: Calendar, category: 'organization', ariaLabel: 'Calendar icon', keywords: ['date', 'schedule'] },
  { id: 'calendar-days', name: 'Calendar Days', icon: CalendarDays, category: 'organization', ariaLabel: 'Calendar days icon', keywords: ['schedule', 'events'] },
  { id: 'clock', name: 'Clock', icon: Clock, category: 'organization', ariaLabel: 'Clock icon', keywords: ['time', 'schedule'] },
  { id: 'timer', name: 'Timer', icon: Timer, category: 'organization', ariaLabel: 'Timer icon', keywords: ['countdown', 'stopwatch'] },
  { id: 'hourglass', name: 'Hourglass', icon: Hourglass, category: 'organization', ariaLabel: 'Hourglass icon', keywords: ['time', 'waiting'] },
  { id: 'list-todo', name: 'Todo List', icon: ListTodo, category: 'organization', ariaLabel: 'Todo list icon', keywords: ['tasks', 'checklist'] },
  { id: 'check-square', name: 'Check Square', icon: CheckSquare, category: 'organization', ariaLabel: 'Checkbox icon', keywords: ['complete', 'done'] },
  { id: 'clipboard-list', name: 'Clipboard List', icon: ClipboardList, category: 'organization', ariaLabel: 'Clipboard list icon', keywords: ['tasks', 'notes'] },
  { id: 'kanban', name: 'Kanban', icon: Kanban, category: 'organization', ariaLabel: 'Kanban board icon', keywords: ['board', 'workflow'] },
  { id: 'layout', name: 'Layout', icon: Layout, category: 'organization', ariaLabel: 'Layout icon', keywords: ['design', 'structure'] },
  { id: 'layout-grid', name: 'Grid Layout', icon: LayoutGrid, category: 'organization', ariaLabel: 'Grid layout icon', keywords: ['tiles', 'gallery'] },
  { id: 'grid', name: 'Grid', icon: Grid3X3, category: 'organization', ariaLabel: 'Grid icon', keywords: ['matrix', 'table'] },

  // Communication
  { id: 'message-square', name: 'Message', icon: MessageSquare, category: 'communication', ariaLabel: 'Message icon', keywords: ['chat', 'comment'] },
  { id: 'message-circle', name: 'Chat Bubble', icon: MessageCircle, category: 'communication', ariaLabel: 'Chat bubble icon', keywords: ['conversation', 'discuss'] },
  { id: 'mail', name: 'Mail', icon: Mail, category: 'communication', ariaLabel: 'Mail icon', keywords: ['email', 'inbox'] },
  { id: 'send', name: 'Send', icon: Send, category: 'communication', ariaLabel: 'Send icon', keywords: ['submit', 'share'] },
  { id: 'bell', name: 'Bell', icon: Bell, category: 'communication', ariaLabel: 'Bell icon', keywords: ['notification', 'alert'] },
  { id: 'megaphone', name: 'Megaphone', icon: Megaphone, category: 'communication', ariaLabel: 'Megaphone icon', keywords: ['announce', 'broadcast'] },

  // Business & Finance
  { id: 'briefcase', name: 'Briefcase', icon: Briefcase, category: 'business', ariaLabel: 'Briefcase icon', keywords: ['work', 'professional'] },
  { id: 'building', name: 'Building', icon: Building, category: 'business', ariaLabel: 'Building icon', keywords: ['office', 'company'] },
  { id: 'building-2', name: 'Office Building', icon: Building2, category: 'business', ariaLabel: 'Office building icon', keywords: ['corporate', 'enterprise'] },
  { id: 'landmark', name: 'Landmark', icon: Landmark, category: 'business', ariaLabel: 'Landmark icon', keywords: ['bank', 'institution'] },
  { id: 'wallet', name: 'Wallet', icon: Wallet, category: 'business', ariaLabel: 'Wallet icon', keywords: ['money', 'payment'] },
  { id: 'credit-card', name: 'Credit Card', icon: CreditCard, category: 'business', ariaLabel: 'Credit card icon', keywords: ['payment', 'billing'] },
  { id: 'dollar-sign', name: 'Dollar Sign', icon: DollarSign, category: 'business', ariaLabel: 'Dollar sign icon', keywords: ['money', 'currency'] },
  { id: 'piggy-bank', name: 'Piggy Bank', icon: PiggyBank, category: 'business', ariaLabel: 'Piggy bank icon', keywords: ['savings', 'money'] },
  { id: 'receipt', name: 'Receipt', icon: Receipt, category: 'business', ariaLabel: 'Receipt icon', keywords: ['invoice', 'bill'] },

  // People & Teams
  { id: 'user', name: 'User', icon: User, category: 'people', ariaLabel: 'User icon', keywords: ['person', 'profile'] },
  { id: 'users', name: 'Users', icon: Users, category: 'people', ariaLabel: 'Users icon', keywords: ['team', 'group'] },
  { id: 'user-circle', name: 'User Circle', icon: UserCircle, category: 'people', ariaLabel: 'User circle icon', keywords: ['avatar', 'profile'] },
  { id: 'user-plus', name: 'Add User', icon: UserPlus, category: 'people', ariaLabel: 'Add user icon', keywords: ['invite', 'new member'] },
  { id: 'users-round', name: 'Team', icon: UsersRound, category: 'people', ariaLabel: 'Team icon', keywords: ['group', 'community'] },
  { id: 'heart', name: 'Heart', icon: Heart, category: 'people', ariaLabel: 'Heart icon', keywords: ['love', 'favorite'] },
  { id: 'heart-handshake', name: 'Partnership', icon: HeartHandshake, category: 'people', ariaLabel: 'Partnership icon', keywords: ['collaboration', 'support'] },
  { id: 'handshake', name: 'Handshake', icon: Handshake, category: 'people', ariaLabel: 'Handshake icon', keywords: ['deal', 'agreement'] },

  // Nature & Science
  { id: 'bug', name: 'Bug', icon: Bug, category: 'nature', ariaLabel: 'Bug icon', keywords: ['insect', 'debug'] },
  { id: 'bird', name: 'Bird', icon: Bird, category: 'nature', ariaLabel: 'Bird icon', keywords: ['animal', 'twitter'] },
  { id: 'cat', name: 'Cat', icon: Cat, category: 'nature', ariaLabel: 'Cat icon', keywords: ['pet', 'animal'] },
  { id: 'dog', name: 'Dog', icon: Dog, category: 'nature', ariaLabel: 'Dog icon', keywords: ['pet', 'animal'] },
  { id: 'fish', name: 'Fish', icon: Fish, category: 'nature', ariaLabel: 'Fish icon', keywords: ['aquatic', 'animal'] },
  { id: 'rabbit', name: 'Rabbit', icon: Rabbit, category: 'nature', ariaLabel: 'Rabbit icon', keywords: ['bunny', 'animal'] },
  { id: 'squirrel', name: 'Squirrel', icon: Squirrel, category: 'nature', ariaLabel: 'Squirrel icon', keywords: ['animal', 'woodland'] },
  { id: 'tree-deciduous', name: 'Deciduous Tree', icon: TreeDeciduous, category: 'nature', ariaLabel: 'Deciduous tree icon', keywords: ['nature', 'forest'] },
  { id: 'tree-pine', name: 'Pine Tree', icon: TreePine, category: 'nature', ariaLabel: 'Pine tree icon', keywords: ['evergreen', 'forest'] },
  { id: 'sprout', name: 'Sprout', icon: Sprout, category: 'nature', ariaLabel: 'Sprout icon', keywords: ['growth', 'plant'] },

  // Travel & Places
  { id: 'map', name: 'Map', icon: Map, category: 'travel', ariaLabel: 'Map icon', keywords: ['navigation', 'location'] },
  { id: 'map-pin', name: 'Map Pin', icon: MapPin, category: 'travel', ariaLabel: 'Map pin icon', keywords: ['location', 'marker'] },
  { id: 'compass', name: 'Compass', icon: Compass, category: 'travel', ariaLabel: 'Compass icon', keywords: ['direction', 'navigation'] },
  { id: 'navigation', name: 'Navigation', icon: Navigation, category: 'travel', ariaLabel: 'Navigation icon', keywords: ['direction', 'arrow'] },
  { id: 'plane', name: 'Plane', icon: Plane, category: 'travel', ariaLabel: 'Airplane icon', keywords: ['flight', 'travel'] },
  { id: 'car', name: 'Car', icon: Car, category: 'travel', ariaLabel: 'Car icon', keywords: ['vehicle', 'drive'] },
  { id: 'ship', name: 'Ship', icon: Ship, category: 'travel', ariaLabel: 'Ship icon', keywords: ['boat', 'cruise'] },
  { id: 'train', name: 'Train', icon: Train, category: 'travel', ariaLabel: 'Train icon', keywords: ['rail', 'transit'] },
  { id: 'rocket', name: 'Rocket', icon: Rocket, category: 'travel', ariaLabel: 'Rocket icon', keywords: ['launch', 'space'] },

  // Health & Wellness
  { id: 'heart-pulse', name: 'Heart Pulse', icon: HeartPulse, category: 'health', ariaLabel: 'Heart pulse icon', keywords: ['health', 'vitals'] },
  { id: 'stethoscope', name: 'Stethoscope', icon: Stethoscope, category: 'health', ariaLabel: 'Stethoscope icon', keywords: ['medical', 'doctor'] },
  { id: 'pill', name: 'Pill', icon: Pill, category: 'health', ariaLabel: 'Pill icon', keywords: ['medicine', 'medication'] },
  { id: 'apple', name: 'Apple', icon: Apple, category: 'health', ariaLabel: 'Apple icon', keywords: ['fruit', 'healthy'] },
  { id: 'salad', name: 'Salad', icon: Salad, category: 'health', ariaLabel: 'Salad icon', keywords: ['food', 'healthy'] },
  { id: 'dumbbell', name: 'Dumbbell', icon: Dumbbell, category: 'health', ariaLabel: 'Dumbbell icon', keywords: ['fitness', 'exercise'] },
  { id: 'person-standing', name: 'Person', icon: PersonStanding, category: 'health', ariaLabel: 'Person standing icon', keywords: ['body', 'human'] },

  // Art & Design
  { id: 'palette', name: 'Palette', icon: Palette, category: 'art', ariaLabel: 'Palette icon', keywords: ['colors', 'paint'] },
  { id: 'brush', name: 'Brush', icon: Brush, category: 'art', ariaLabel: 'Brush icon', keywords: ['paint', 'art'] },
  { id: 'paintbrush', name: 'Paintbrush', icon: Paintbrush, category: 'art', ariaLabel: 'Paintbrush icon', keywords: ['art', 'design'] },
  { id: 'scissors', name: 'Scissors', icon: Scissors, category: 'art', ariaLabel: 'Scissors icon', keywords: ['cut', 'craft'] },
  { id: 'shapes', name: 'Shapes', icon: Shapes, category: 'art', ariaLabel: 'Shapes icon', keywords: ['geometry', 'design'] },
  { id: 'circle', name: 'Circle', icon: Circle, category: 'art', ariaLabel: 'Circle icon', keywords: ['shape', 'round'] },
  { id: 'square', name: 'Square', icon: Square, category: 'art', ariaLabel: 'Square icon', keywords: ['shape', 'box'] },
  { id: 'triangle', name: 'Triangle', icon: Triangle, category: 'art', ariaLabel: 'Triangle icon', keywords: ['shape', 'warning'] },
  { id: 'hexagon', name: 'Hexagon', icon: Hexagon, category: 'art', ariaLabel: 'Hexagon icon', keywords: ['shape', 'polygon'] },

  // Games & Fun
  { id: 'gamepad', name: 'Gamepad', icon: Gamepad2, category: 'games', ariaLabel: 'Gamepad icon', keywords: ['gaming', 'controller'] },
  { id: 'dice', name: 'Dice', icon: Dice5, category: 'games', ariaLabel: 'Dice icon', keywords: ['game', 'random'] },
  { id: 'puzzle', name: 'Puzzle', icon: Puzzle, category: 'games', ariaLabel: 'Puzzle icon', keywords: ['game', 'solve'] },
  { id: 'trophy', name: 'Trophy', icon: Trophy, category: 'games', ariaLabel: 'Trophy icon', keywords: ['award', 'winner'] },
  { id: 'medal', name: 'Medal', icon: Medal, category: 'games', ariaLabel: 'Medal icon', keywords: ['award', 'achievement'] },
  { id: 'award', name: 'Award', icon: Award, category: 'games', ariaLabel: 'Award icon', keywords: ['prize', 'recognition'] },
  { id: 'gift', name: 'Gift', icon: Gift, category: 'games', ariaLabel: 'Gift icon', keywords: ['present', 'reward'] },
  { id: 'party-popper', name: 'Party', icon: PartyPopper, category: 'games', ariaLabel: 'Party popper icon', keywords: ['celebration', 'confetti'] },

  // Security & Privacy
  { id: 'lock', name: 'Lock', icon: Lock, category: 'security', ariaLabel: 'Lock icon', keywords: ['secure', 'private'] },
  { id: 'unlock', name: 'Unlock', icon: Unlock, category: 'security', ariaLabel: 'Unlock icon', keywords: ['open', 'access'] },
  { id: 'key', name: 'Key', icon: Key, category: 'security', ariaLabel: 'Key icon', keywords: ['access', 'password'] },
  { id: 'shield-check', name: 'Shield Check', icon: ShieldCheck, category: 'security', ariaLabel: 'Shield check icon', keywords: ['protected', 'verified'] },
  { id: 'fingerprint', name: 'Fingerprint', icon: Fingerprint, category: 'security', ariaLabel: 'Fingerprint icon', keywords: ['biometric', 'identity'] },
  { id: 'eye', name: 'Eye', icon: Eye, category: 'security', ariaLabel: 'Eye icon', keywords: ['view', 'visible'] },
  { id: 'eye-off', name: 'Eye Off', icon: EyeOff, category: 'security', ariaLabel: 'Eye off icon', keywords: ['hidden', 'invisible'] },

  // Miscellaneous
  { id: 'box', name: 'Box', icon: Box, category: 'misc', ariaLabel: 'Box icon', keywords: ['container', 'package'] },
  { id: 'package', name: 'Package', icon: Package, category: 'misc', ariaLabel: 'Package icon', keywords: ['box', 'delivery'] },
  { id: 'archive', name: 'Archive', icon: Archive, category: 'misc', ariaLabel: 'Archive icon', keywords: ['storage', 'old'] },
  { id: 'bookmark', name: 'Bookmark', icon: Bookmark, category: 'misc', ariaLabel: 'Bookmark icon', keywords: ['save', 'favorite'] },
  { id: 'tag', name: 'Tag', icon: Tag, category: 'misc', ariaLabel: 'Tag icon', keywords: ['label', 'category'] },
  { id: 'tags', name: 'Tags', icon: Tags, category: 'misc', ariaLabel: 'Tags icon', keywords: ['labels', 'categories'] },
  { id: 'hash', name: 'Hash', icon: Hash, category: 'misc', ariaLabel: 'Hash icon', keywords: ['hashtag', 'number'] },
  { id: 'link', name: 'Link', icon: Link, category: 'misc', ariaLabel: 'Link icon', keywords: ['url', 'connection'] },
  { id: 'anchor', name: 'Anchor', icon: Anchor, category: 'misc', ariaLabel: 'Anchor icon', keywords: ['marine', 'stable'] },
  { id: 'infinity', name: 'Infinity', icon: Infinity, category: 'misc', ariaLabel: 'Infinity icon', keywords: ['endless', 'forever'] },
  { id: 'zap', name: 'Zap', icon: Zap, category: 'misc', ariaLabel: 'Zap icon', keywords: ['lightning', 'fast'] },
  { id: 'flame', name: 'Flame', icon: Flame, category: 'misc', ariaLabel: 'Flame icon', keywords: ['fire', 'hot'] },
  { id: 'snowflake', name: 'Snowflake', icon: Snowflake, category: 'misc', ariaLabel: 'Snowflake icon', keywords: ['cold', 'winter'] },
  { id: 'umbrella', name: 'Umbrella', icon: Umbrella, category: 'misc', ariaLabel: 'Umbrella icon', keywords: ['rain', 'weather'] },
  { id: 'coffee', name: 'Coffee', icon: Coffee, category: 'misc', ariaLabel: 'Coffee icon', keywords: ['drink', 'cafe'] },
  { id: 'wine', name: 'Wine', icon: Wine, category: 'misc', ariaLabel: 'Wine icon', keywords: ['drink', 'celebration'] },
  { id: 'utensils', name: 'Utensils', icon: Utensils, category: 'misc', ariaLabel: 'Utensils icon', keywords: ['food', 'restaurant'] },
  { id: 'home', name: 'Home', icon: Home, category: 'misc', ariaLabel: 'Home icon', keywords: ['house', 'main'] },
  { id: 'store', name: 'Store', icon: Store, category: 'misc', ariaLabel: 'Store icon', keywords: ['shop', 'retail'] },
  { id: 'factory', name: 'Factory', icon: Factory, category: 'misc', ariaLabel: 'Factory icon', keywords: ['industrial', 'manufacturing'] },
  { id: 'warehouse', name: 'Warehouse', icon: Warehouse, category: 'misc', ariaLabel: 'Warehouse icon', keywords: ['storage', 'inventory'] },
];

/**
 * Default icon ID for Looms
 */
export const DEFAULT_LOOM_ICON = 'folder';

/**
 * Default icon ID for Weaves
 */
export const DEFAULT_WEAVE_ICON = 'sparkles';

/**
 * Get a preset icon by ID
 */
export function getPresetIcon(iconId: string | undefined | null): PresetIcon | undefined {
  if (!iconId) return undefined;
  return PRESET_ICONS.find((icon) => icon.id === iconId);
}

/**
 * Get the default Loom icon
 */
export function getDefaultLoomIcon(): PresetIcon {
  return PRESET_ICONS.find((icon) => icon.id === DEFAULT_LOOM_ICON)!;
}

/**
 * Get the default Weave icon
 */
export function getDefaultWeaveIcon(): PresetIcon {
  return PRESET_ICONS.find((icon) => icon.id === DEFAULT_WEAVE_ICON)!;
}

/**
 * Get icons by category
 */
export function getIconsByCategory(category: IconCategory): PresetIcon[] {
  return PRESET_ICONS.filter((icon) => icon.category === category);
}

/**
 * Search icons by keyword
 */
export function searchIcons(query: string): PresetIcon[] {
  const lowerQuery = query.toLowerCase();
  return PRESET_ICONS.filter((icon) => {
    return (
      icon.name.toLowerCase().includes(lowerQuery) ||
      icon.id.toLowerCase().includes(lowerQuery) ||
      icon.ariaLabel.toLowerCase().includes(lowerQuery) ||
      icon.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Get recommended icons for a Loom use case
 */
export function getRecommendedIconsForUseCase(
  useCase: 'storytelling' | 'worldbuilding' | 'research' | 'notebook' | 'documentation' | 'education' | 'custom'
): PresetIcon[] {
  const categoryMap: Record<string, IconCategory[]> = {
    storytelling: ['storytelling', 'creative'],
    worldbuilding: ['worldbuilding', 'storytelling'],
    research: ['knowledge', 'data'],
    notebook: ['creative', 'organization'],
    documentation: ['technology', 'organization'],
    education: ['knowledge', 'organization'],
    custom: ['default', 'misc'],
  };
  
  const categories = categoryMap[useCase] || categoryMap.custom;
  return PRESET_ICONS.filter((icon) => categories.includes(icon.category));
}



 * Preset Icon Registry for OpenStrand
 * 
 * Provides a curated list of accessible, ARIA-compliant icons from Lucide
 * for use in Looms, Weaves, folders, and other entities.
 * 
 * Icons are organized by category for easy selection in the UI.
 * Each icon has a unique identifier, display name, and accessibility label.
 * 
 * @module lib/icons/preset-icons
 */

import type { LucideIcon } from 'lucide-react';
import {
  // Default/General
  Folder,
  FolderOpen,
  FolderTree,
  File,
  FileText,
  Files,
  
  // Knowledge & Research
  Book,
  BookOpen,
  BookMarked,
  Library,
  GraduationCap,
  School,
  Lightbulb,
  Brain,
  Atom,
  Microscope,
  FlaskConical,
  TestTube,
  Dna,
  
  // Creative & Writing
  Pen,
  PenTool,
  Pencil,
  Feather,
  Scroll,
  NotebookPen,
  FileEdit,
  Quote,
  Type,
  
  // Storytelling & Narrative
  Drama,
  Clapperboard,
  Film,
  Camera,
  Video,
  Tv,
  Radio,
  Mic,
  Music,
  Music2,
  Music4,
  
  // World-building & Fantasy
  Castle,
  Crown,
  Swords,
  Shield,
  Wand2,
  Sparkles,
  Star,
  Moon,
  Sun,
  Mountain,
  Trees,
  Palmtree,
  Flower,
  Leaf,
  
  // Technology & Code
  Code,
  Code2,
  Terminal,
  Cpu,
  Server,
  Database,
  HardDrive,
  Cloud,
  Globe,
  Wifi,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  
  // Data & Analytics
  BarChart,
  BarChart2,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Activity,
  Gauge,
  Target,
  
  // Organization & Planning
  Calendar,
  CalendarDays,
  Clock,
  Timer,
  Hourglass,
  ListTodo,
  CheckSquare,
  ClipboardList,
  Kanban,
  Layout,
  LayoutGrid,
  Grid3X3,
  
  // Communication
  MessageSquare,
  MessageCircle,
  Mail,
  Send,
  Bell,
  Megaphone,
  
  // Business & Finance
  Briefcase,
  Building,
  Building2,
  Landmark,
  Wallet,
  CreditCard,
  DollarSign,
  PiggyBank,
  Receipt,
  
  // People & Teams
  User,
  Users,
  UserCircle,
  UserPlus,
  UsersRound,
  Heart,
  HeartHandshake,
  Handshake,
  
  // Nature & Science
  Bug,
  Bird,
  Cat,
  Dog,
  Fish,
  Rabbit,
  Squirrel,
  TreeDeciduous,
  TreePine,
  Sprout,
  
  // Travel & Places
  Map,
  MapPin,
  Compass,
  Navigation,
  Plane,
  Car,
  Ship,
  Train,
  Rocket,
  
  // Health & Wellness
  HeartPulse,
  Stethoscope,
  Pill,
  Apple,
  Salad,
  Dumbbell,
  PersonStanding,
  
  // Art & Design
  Palette,
  Brush,
  Paintbrush,
  Scissors,
  Shapes,
  Circle,
  Square,
  Triangle,
  Hexagon,
  
  // Games & Fun
  Gamepad2,
  Dice5,
  Puzzle,
  Trophy,
  Medal,
  Award,
  Gift,
  PartyPopper,
  
  // Security & Privacy
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  Fingerprint,
  Eye,
  EyeOff,
  
  // Misc Useful
  Box,
  Package,
  Archive,
  Bookmark,
  Tag,
  Tags,
  Hash,
  Link,
  Anchor,
  Infinity,
  Zap,
  Flame,
  Snowflake,
  Umbrella,
  Coffee,
  Wine,
  Utensils,
  Home,
  Store,
  Factory,
  Warehouse,
} from 'lucide-react';

/**
 * Icon category for organizing preset icons
 */
export type IconCategory =
  | 'default'
  | 'knowledge'
  | 'creative'
  | 'storytelling'
  | 'worldbuilding'
  | 'technology'
  | 'data'
  | 'organization'
  | 'communication'
  | 'business'
  | 'people'
  | 'nature'
  | 'travel'
  | 'health'
  | 'art'
  | 'games'
  | 'security'
  | 'misc';

/**
 * Preset icon definition
 */
export interface PresetIcon {
  /** Unique identifier for the icon (used in DB) */
  id: string;
  /** Display name for the icon */
  name: string;
  /** The Lucide icon component */
  icon: LucideIcon;
  /** Category for organization */
  category: IconCategory;
  /** Accessibility label for screen readers */
  ariaLabel: string;
  /** Optional keywords for search */
  keywords?: string[];
}

/**
 * Category metadata
 */
export interface IconCategoryMeta {
  id: IconCategory;
  name: string;
  description: string;
}

/**
 * Category definitions with metadata
 */
export const ICON_CATEGORIES: IconCategoryMeta[] = [
  { id: 'default', name: 'Default', description: 'Basic folder and file icons' },
  { id: 'knowledge', name: 'Knowledge & Research', description: 'Academic and research icons' },
  { id: 'creative', name: 'Creative & Writing', description: 'Writing and content creation' },
  { id: 'storytelling', name: 'Storytelling', description: 'Media and narrative icons' },
  { id: 'worldbuilding', name: 'World-building', description: 'Fantasy and world creation' },
  { id: 'technology', name: 'Technology', description: 'Tech and development icons' },
  { id: 'data', name: 'Data & Analytics', description: 'Charts and data visualization' },
  { id: 'organization', name: 'Organization', description: 'Planning and productivity' },
  { id: 'communication', name: 'Communication', description: 'Messaging and notifications' },
  { id: 'business', name: 'Business', description: 'Business and finance icons' },
  { id: 'people', name: 'People & Teams', description: 'Users and collaboration' },
  { id: 'nature', name: 'Nature & Science', description: 'Nature and biology' },
  { id: 'travel', name: 'Travel & Places', description: 'Maps and transportation' },
  { id: 'health', name: 'Health & Wellness', description: 'Health and fitness' },
  { id: 'art', name: 'Art & Design', description: 'Design and creativity' },
  { id: 'games', name: 'Games & Fun', description: 'Gaming and entertainment' },
  { id: 'security', name: 'Security', description: 'Privacy and security' },
  { id: 'misc', name: 'Miscellaneous', description: 'Other useful icons' },
];

/**
 * Complete preset icon registry
 */
export const PRESET_ICONS: PresetIcon[] = [
  // Default/General
  { id: 'folder', name: 'Folder', icon: Folder, category: 'default', ariaLabel: 'Folder icon', keywords: ['directory', 'container'] },
  { id: 'folder-open', name: 'Folder Open', icon: FolderOpen, category: 'default', ariaLabel: 'Open folder icon', keywords: ['directory', 'expanded'] },
  { id: 'folder-tree', name: 'Folder Tree', icon: FolderTree, category: 'default', ariaLabel: 'Folder tree icon', keywords: ['hierarchy', 'structure'] },
  { id: 'file', name: 'File', icon: File, category: 'default', ariaLabel: 'File icon', keywords: ['document'] },
  { id: 'file-text', name: 'File Text', icon: FileText, category: 'default', ariaLabel: 'Text file icon', keywords: ['document', 'text'] },
  { id: 'files', name: 'Files', icon: Files, category: 'default', ariaLabel: 'Multiple files icon', keywords: ['documents', 'collection'] },

  // Knowledge & Research
  { id: 'book', name: 'Book', icon: Book, category: 'knowledge', ariaLabel: 'Book icon', keywords: ['reading', 'literature'] },
  { id: 'book-open', name: 'Book Open', icon: BookOpen, category: 'knowledge', ariaLabel: 'Open book icon', keywords: ['reading', 'study'] },
  { id: 'book-marked', name: 'Bookmarked', icon: BookMarked, category: 'knowledge', ariaLabel: 'Bookmarked book icon', keywords: ['saved', 'reference'] },
  { id: 'library', name: 'Library', icon: Library, category: 'knowledge', ariaLabel: 'Library icon', keywords: ['collection', 'archive'] },
  { id: 'graduation-cap', name: 'Graduation Cap', icon: GraduationCap, category: 'knowledge', ariaLabel: 'Graduation cap icon', keywords: ['education', 'academic'] },
  { id: 'school', name: 'School', icon: School, category: 'knowledge', ariaLabel: 'School icon', keywords: ['education', 'learning'] },
  { id: 'lightbulb', name: 'Lightbulb', icon: Lightbulb, category: 'knowledge', ariaLabel: 'Lightbulb icon', keywords: ['idea', 'insight'] },
  { id: 'brain', name: 'Brain', icon: Brain, category: 'knowledge', ariaLabel: 'Brain icon', keywords: ['thinking', 'intelligence', 'ai'] },
  { id: 'atom', name: 'Atom', icon: Atom, category: 'knowledge', ariaLabel: 'Atom icon', keywords: ['science', 'physics'] },
  { id: 'microscope', name: 'Microscope', icon: Microscope, category: 'knowledge', ariaLabel: 'Microscope icon', keywords: ['research', 'science'] },
  { id: 'flask', name: 'Flask', icon: FlaskConical, category: 'knowledge', ariaLabel: 'Flask icon', keywords: ['chemistry', 'experiment'] },
  { id: 'test-tube', name: 'Test Tube', icon: TestTube, category: 'knowledge', ariaLabel: 'Test tube icon', keywords: ['experiment', 'lab'] },
  { id: 'dna', name: 'DNA', icon: Dna, category: 'knowledge', ariaLabel: 'DNA icon', keywords: ['genetics', 'biology'] },

  // Creative & Writing
  { id: 'pen', name: 'Pen', icon: Pen, category: 'creative', ariaLabel: 'Pen icon', keywords: ['write', 'edit'] },
  { id: 'pen-tool', name: 'Pen Tool', icon: PenTool, category: 'creative', ariaLabel: 'Pen tool icon', keywords: ['design', 'draw'] },
  { id: 'pencil', name: 'Pencil', icon: Pencil, category: 'creative', ariaLabel: 'Pencil icon', keywords: ['write', 'sketch'] },
  { id: 'feather', name: 'Feather', icon: Feather, category: 'creative', ariaLabel: 'Feather icon', keywords: ['write', 'quill'] },
  { id: 'scroll', name: 'Scroll', icon: Scroll, category: 'creative', ariaLabel: 'Scroll icon', keywords: ['document', 'ancient'] },
  { id: 'notebook', name: 'Notebook', icon: NotebookPen, category: 'creative', ariaLabel: 'Notebook icon', keywords: ['notes', 'journal'] },
  { id: 'file-edit', name: 'File Edit', icon: FileEdit, category: 'creative', ariaLabel: 'Edit file icon', keywords: ['document', 'modify'] },
  { id: 'quote', name: 'Quote', icon: Quote, category: 'creative', ariaLabel: 'Quote icon', keywords: ['citation', 'text'] },
  { id: 'type', name: 'Type', icon: Type, category: 'creative', ariaLabel: 'Typography icon', keywords: ['text', 'font'] },

  // Storytelling & Narrative
  { id: 'drama', name: 'Drama', icon: Drama, category: 'storytelling', ariaLabel: 'Drama masks icon', keywords: ['theater', 'acting'] },
  { id: 'clapperboard', name: 'Clapperboard', icon: Clapperboard, category: 'storytelling', ariaLabel: 'Clapperboard icon', keywords: ['film', 'movie'] },
  { id: 'film', name: 'Film', icon: Film, category: 'storytelling', ariaLabel: 'Film icon', keywords: ['movie', 'video'] },
  { id: 'camera', name: 'Camera', icon: Camera, category: 'storytelling', ariaLabel: 'Camera icon', keywords: ['photo', 'capture'] },
  { id: 'video', name: 'Video', icon: Video, category: 'storytelling', ariaLabel: 'Video icon', keywords: ['movie', 'recording'] },
  { id: 'tv', name: 'TV', icon: Tv, category: 'storytelling', ariaLabel: 'Television icon', keywords: ['screen', 'broadcast'] },
  { id: 'radio', name: 'Radio', icon: Radio, category: 'storytelling', ariaLabel: 'Radio icon', keywords: ['broadcast', 'audio'] },
  { id: 'mic', name: 'Microphone', icon: Mic, category: 'storytelling', ariaLabel: 'Microphone icon', keywords: ['audio', 'podcast'] },
  { id: 'music', name: 'Music', icon: Music, category: 'storytelling', ariaLabel: 'Music icon', keywords: ['audio', 'song'] },
  { id: 'music2', name: 'Music Note', icon: Music2, category: 'storytelling', ariaLabel: 'Music note icon', keywords: ['audio', 'melody'] },
  { id: 'music4', name: 'Music Notes', icon: Music4, category: 'storytelling', ariaLabel: 'Music notes icon', keywords: ['audio', 'composition'] },

  // World-building & Fantasy
  { id: 'castle', name: 'Castle', icon: Castle, category: 'worldbuilding', ariaLabel: 'Castle icon', keywords: ['fantasy', 'medieval'] },
  { id: 'crown', name: 'Crown', icon: Crown, category: 'worldbuilding', ariaLabel: 'Crown icon', keywords: ['royalty', 'king'] },
  { id: 'swords', name: 'Swords', icon: Swords, category: 'worldbuilding', ariaLabel: 'Crossed swords icon', keywords: ['battle', 'combat'] },
  { id: 'shield', name: 'Shield', icon: Shield, category: 'worldbuilding', ariaLabel: 'Shield icon', keywords: ['defense', 'protection'] },
  { id: 'wand', name: 'Magic Wand', icon: Wand2, category: 'worldbuilding', ariaLabel: 'Magic wand icon', keywords: ['magic', 'spell'] },
  { id: 'sparkles', name: 'Sparkles', icon: Sparkles, category: 'worldbuilding', ariaLabel: 'Sparkles icon', keywords: ['magic', 'special'] },
  { id: 'star', name: 'Star', icon: Star, category: 'worldbuilding', ariaLabel: 'Star icon', keywords: ['celestial', 'favorite'] },
  { id: 'moon', name: 'Moon', icon: Moon, category: 'worldbuilding', ariaLabel: 'Moon icon', keywords: ['night', 'celestial'] },
  { id: 'sun', name: 'Sun', icon: Sun, category: 'worldbuilding', ariaLabel: 'Sun icon', keywords: ['day', 'celestial'] },
  { id: 'mountain', name: 'Mountain', icon: Mountain, category: 'worldbuilding', ariaLabel: 'Mountain icon', keywords: ['terrain', 'landscape'] },
  { id: 'trees', name: 'Trees', icon: Trees, category: 'worldbuilding', ariaLabel: 'Trees icon', keywords: ['forest', 'nature'] },
  { id: 'palmtree', name: 'Palm Tree', icon: Palmtree, category: 'worldbuilding', ariaLabel: 'Palm tree icon', keywords: ['tropical', 'beach'] },
  { id: 'flower', name: 'Flower', icon: Flower, category: 'worldbuilding', ariaLabel: 'Flower icon', keywords: ['nature', 'garden'] },
  { id: 'leaf', name: 'Leaf', icon: Leaf, category: 'worldbuilding', ariaLabel: 'Leaf icon', keywords: ['nature', 'plant'] },

  // Technology & Code
  { id: 'code', name: 'Code', icon: Code, category: 'technology', ariaLabel: 'Code icon', keywords: ['programming', 'development'] },
  { id: 'code2', name: 'Code Brackets', icon: Code2, category: 'technology', ariaLabel: 'Code brackets icon', keywords: ['programming', 'syntax'] },
  { id: 'terminal', name: 'Terminal', icon: Terminal, category: 'technology', ariaLabel: 'Terminal icon', keywords: ['command', 'shell'] },
  { id: 'cpu', name: 'CPU', icon: Cpu, category: 'technology', ariaLabel: 'CPU icon', keywords: ['processor', 'hardware'] },
  { id: 'server', name: 'Server', icon: Server, category: 'technology', ariaLabel: 'Server icon', keywords: ['backend', 'infrastructure'] },
  { id: 'database', name: 'Database', icon: Database, category: 'technology', ariaLabel: 'Database icon', keywords: ['data', 'storage'] },
  { id: 'hard-drive', name: 'Hard Drive', icon: HardDrive, category: 'technology', ariaLabel: 'Hard drive icon', keywords: ['storage', 'disk'] },
  { id: 'cloud', name: 'Cloud', icon: Cloud, category: 'technology', ariaLabel: 'Cloud icon', keywords: ['hosting', 'saas'] },
  { id: 'globe', name: 'Globe', icon: Globe, category: 'technology', ariaLabel: 'Globe icon', keywords: ['web', 'internet'] },
  { id: 'wifi', name: 'WiFi', icon: Wifi, category: 'technology', ariaLabel: 'WiFi icon', keywords: ['network', 'wireless'] },
  { id: 'laptop', name: 'Laptop', icon: Laptop, category: 'technology', ariaLabel: 'Laptop icon', keywords: ['computer', 'device'] },
  { id: 'monitor', name: 'Monitor', icon: Monitor, category: 'technology', ariaLabel: 'Monitor icon', keywords: ['screen', 'display'] },
  { id: 'smartphone', name: 'Smartphone', icon: Smartphone, category: 'technology', ariaLabel: 'Smartphone icon', keywords: ['mobile', 'phone'] },
  { id: 'tablet', name: 'Tablet', icon: Tablet, category: 'technology', ariaLabel: 'Tablet icon', keywords: ['device', 'ipad'] },

  // Data & Analytics
  { id: 'bar-chart', name: 'Bar Chart', icon: BarChart, category: 'data', ariaLabel: 'Bar chart icon', keywords: ['graph', 'statistics'] },
  { id: 'bar-chart-2', name: 'Bar Chart 2', icon: BarChart2, category: 'data', ariaLabel: 'Bar chart icon', keywords: ['graph', 'analytics'] },
  { id: 'bar-chart-3', name: 'Bar Chart 3', icon: BarChart3, category: 'data', ariaLabel: 'Horizontal bar chart icon', keywords: ['graph', 'horizontal'] },
  { id: 'pie-chart', name: 'Pie Chart', icon: PieChart, category: 'data', ariaLabel: 'Pie chart icon', keywords: ['graph', 'distribution'] },
  { id: 'line-chart', name: 'Line Chart', icon: LineChart, category: 'data', ariaLabel: 'Line chart icon', keywords: ['graph', 'trend'] },
  { id: 'trending-up', name: 'Trending Up', icon: TrendingUp, category: 'data', ariaLabel: 'Trending up icon', keywords: ['growth', 'increase'] },
  { id: 'activity', name: 'Activity', icon: Activity, category: 'data', ariaLabel: 'Activity icon', keywords: ['pulse', 'metrics'] },
  { id: 'gauge', name: 'Gauge', icon: Gauge, category: 'data', ariaLabel: 'Gauge icon', keywords: ['meter', 'performance'] },
  { id: 'target', name: 'Target', icon: Target, category: 'data', ariaLabel: 'Target icon', keywords: ['goal', 'objective'] },

  // Organization & Planning
  { id: 'calendar', name: 'Calendar', icon: Calendar, category: 'organization', ariaLabel: 'Calendar icon', keywords: ['date', 'schedule'] },
  { id: 'calendar-days', name: 'Calendar Days', icon: CalendarDays, category: 'organization', ariaLabel: 'Calendar days icon', keywords: ['schedule', 'events'] },
  { id: 'clock', name: 'Clock', icon: Clock, category: 'organization', ariaLabel: 'Clock icon', keywords: ['time', 'schedule'] },
  { id: 'timer', name: 'Timer', icon: Timer, category: 'organization', ariaLabel: 'Timer icon', keywords: ['countdown', 'stopwatch'] },
  { id: 'hourglass', name: 'Hourglass', icon: Hourglass, category: 'organization', ariaLabel: 'Hourglass icon', keywords: ['time', 'waiting'] },
  { id: 'list-todo', name: 'Todo List', icon: ListTodo, category: 'organization', ariaLabel: 'Todo list icon', keywords: ['tasks', 'checklist'] },
  { id: 'check-square', name: 'Check Square', icon: CheckSquare, category: 'organization', ariaLabel: 'Checkbox icon', keywords: ['complete', 'done'] },
  { id: 'clipboard-list', name: 'Clipboard List', icon: ClipboardList, category: 'organization', ariaLabel: 'Clipboard list icon', keywords: ['tasks', 'notes'] },
  { id: 'kanban', name: 'Kanban', icon: Kanban, category: 'organization', ariaLabel: 'Kanban board icon', keywords: ['board', 'workflow'] },
  { id: 'layout', name: 'Layout', icon: Layout, category: 'organization', ariaLabel: 'Layout icon', keywords: ['design', 'structure'] },
  { id: 'layout-grid', name: 'Grid Layout', icon: LayoutGrid, category: 'organization', ariaLabel: 'Grid layout icon', keywords: ['tiles', 'gallery'] },
  { id: 'grid', name: 'Grid', icon: Grid3X3, category: 'organization', ariaLabel: 'Grid icon', keywords: ['matrix', 'table'] },

  // Communication
  { id: 'message-square', name: 'Message', icon: MessageSquare, category: 'communication', ariaLabel: 'Message icon', keywords: ['chat', 'comment'] },
  { id: 'message-circle', name: 'Chat Bubble', icon: MessageCircle, category: 'communication', ariaLabel: 'Chat bubble icon', keywords: ['conversation', 'discuss'] },
  { id: 'mail', name: 'Mail', icon: Mail, category: 'communication', ariaLabel: 'Mail icon', keywords: ['email', 'inbox'] },
  { id: 'send', name: 'Send', icon: Send, category: 'communication', ariaLabel: 'Send icon', keywords: ['submit', 'share'] },
  { id: 'bell', name: 'Bell', icon: Bell, category: 'communication', ariaLabel: 'Bell icon', keywords: ['notification', 'alert'] },
  { id: 'megaphone', name: 'Megaphone', icon: Megaphone, category: 'communication', ariaLabel: 'Megaphone icon', keywords: ['announce', 'broadcast'] },

  // Business & Finance
  { id: 'briefcase', name: 'Briefcase', icon: Briefcase, category: 'business', ariaLabel: 'Briefcase icon', keywords: ['work', 'professional'] },
  { id: 'building', name: 'Building', icon: Building, category: 'business', ariaLabel: 'Building icon', keywords: ['office', 'company'] },
  { id: 'building-2', name: 'Office Building', icon: Building2, category: 'business', ariaLabel: 'Office building icon', keywords: ['corporate', 'enterprise'] },
  { id: 'landmark', name: 'Landmark', icon: Landmark, category: 'business', ariaLabel: 'Landmark icon', keywords: ['bank', 'institution'] },
  { id: 'wallet', name: 'Wallet', icon: Wallet, category: 'business', ariaLabel: 'Wallet icon', keywords: ['money', 'payment'] },
  { id: 'credit-card', name: 'Credit Card', icon: CreditCard, category: 'business', ariaLabel: 'Credit card icon', keywords: ['payment', 'billing'] },
  { id: 'dollar-sign', name: 'Dollar Sign', icon: DollarSign, category: 'business', ariaLabel: 'Dollar sign icon', keywords: ['money', 'currency'] },
  { id: 'piggy-bank', name: 'Piggy Bank', icon: PiggyBank, category: 'business', ariaLabel: 'Piggy bank icon', keywords: ['savings', 'money'] },
  { id: 'receipt', name: 'Receipt', icon: Receipt, category: 'business', ariaLabel: 'Receipt icon', keywords: ['invoice', 'bill'] },

  // People & Teams
  { id: 'user', name: 'User', icon: User, category: 'people', ariaLabel: 'User icon', keywords: ['person', 'profile'] },
  { id: 'users', name: 'Users', icon: Users, category: 'people', ariaLabel: 'Users icon', keywords: ['team', 'group'] },
  { id: 'user-circle', name: 'User Circle', icon: UserCircle, category: 'people', ariaLabel: 'User circle icon', keywords: ['avatar', 'profile'] },
  { id: 'user-plus', name: 'Add User', icon: UserPlus, category: 'people', ariaLabel: 'Add user icon', keywords: ['invite', 'new member'] },
  { id: 'users-round', name: 'Team', icon: UsersRound, category: 'people', ariaLabel: 'Team icon', keywords: ['group', 'community'] },
  { id: 'heart', name: 'Heart', icon: Heart, category: 'people', ariaLabel: 'Heart icon', keywords: ['love', 'favorite'] },
  { id: 'heart-handshake', name: 'Partnership', icon: HeartHandshake, category: 'people', ariaLabel: 'Partnership icon', keywords: ['collaboration', 'support'] },
  { id: 'handshake', name: 'Handshake', icon: Handshake, category: 'people', ariaLabel: 'Handshake icon', keywords: ['deal', 'agreement'] },

  // Nature & Science
  { id: 'bug', name: 'Bug', icon: Bug, category: 'nature', ariaLabel: 'Bug icon', keywords: ['insect', 'debug'] },
  { id: 'bird', name: 'Bird', icon: Bird, category: 'nature', ariaLabel: 'Bird icon', keywords: ['animal', 'twitter'] },
  { id: 'cat', name: 'Cat', icon: Cat, category: 'nature', ariaLabel: 'Cat icon', keywords: ['pet', 'animal'] },
  { id: 'dog', name: 'Dog', icon: Dog, category: 'nature', ariaLabel: 'Dog icon', keywords: ['pet', 'animal'] },
  { id: 'fish', name: 'Fish', icon: Fish, category: 'nature', ariaLabel: 'Fish icon', keywords: ['aquatic', 'animal'] },
  { id: 'rabbit', name: 'Rabbit', icon: Rabbit, category: 'nature', ariaLabel: 'Rabbit icon', keywords: ['bunny', 'animal'] },
  { id: 'squirrel', name: 'Squirrel', icon: Squirrel, category: 'nature', ariaLabel: 'Squirrel icon', keywords: ['animal', 'woodland'] },
  { id: 'tree-deciduous', name: 'Deciduous Tree', icon: TreeDeciduous, category: 'nature', ariaLabel: 'Deciduous tree icon', keywords: ['nature', 'forest'] },
  { id: 'tree-pine', name: 'Pine Tree', icon: TreePine, category: 'nature', ariaLabel: 'Pine tree icon', keywords: ['evergreen', 'forest'] },
  { id: 'sprout', name: 'Sprout', icon: Sprout, category: 'nature', ariaLabel: 'Sprout icon', keywords: ['growth', 'plant'] },

  // Travel & Places
  { id: 'map', name: 'Map', icon: Map, category: 'travel', ariaLabel: 'Map icon', keywords: ['navigation', 'location'] },
  { id: 'map-pin', name: 'Map Pin', icon: MapPin, category: 'travel', ariaLabel: 'Map pin icon', keywords: ['location', 'marker'] },
  { id: 'compass', name: 'Compass', icon: Compass, category: 'travel', ariaLabel: 'Compass icon', keywords: ['direction', 'navigation'] },
  { id: 'navigation', name: 'Navigation', icon: Navigation, category: 'travel', ariaLabel: 'Navigation icon', keywords: ['direction', 'arrow'] },
  { id: 'plane', name: 'Plane', icon: Plane, category: 'travel', ariaLabel: 'Airplane icon', keywords: ['flight', 'travel'] },
  { id: 'car', name: 'Car', icon: Car, category: 'travel', ariaLabel: 'Car icon', keywords: ['vehicle', 'drive'] },
  { id: 'ship', name: 'Ship', icon: Ship, category: 'travel', ariaLabel: 'Ship icon', keywords: ['boat', 'cruise'] },
  { id: 'train', name: 'Train', icon: Train, category: 'travel', ariaLabel: 'Train icon', keywords: ['rail', 'transit'] },
  { id: 'rocket', name: 'Rocket', icon: Rocket, category: 'travel', ariaLabel: 'Rocket icon', keywords: ['launch', 'space'] },

  // Health & Wellness
  { id: 'heart-pulse', name: 'Heart Pulse', icon: HeartPulse, category: 'health', ariaLabel: 'Heart pulse icon', keywords: ['health', 'vitals'] },
  { id: 'stethoscope', name: 'Stethoscope', icon: Stethoscope, category: 'health', ariaLabel: 'Stethoscope icon', keywords: ['medical', 'doctor'] },
  { id: 'pill', name: 'Pill', icon: Pill, category: 'health', ariaLabel: 'Pill icon', keywords: ['medicine', 'medication'] },
  { id: 'apple', name: 'Apple', icon: Apple, category: 'health', ariaLabel: 'Apple icon', keywords: ['fruit', 'healthy'] },
  { id: 'salad', name: 'Salad', icon: Salad, category: 'health', ariaLabel: 'Salad icon', keywords: ['food', 'healthy'] },
  { id: 'dumbbell', name: 'Dumbbell', icon: Dumbbell, category: 'health', ariaLabel: 'Dumbbell icon', keywords: ['fitness', 'exercise'] },
  { id: 'person-standing', name: 'Person', icon: PersonStanding, category: 'health', ariaLabel: 'Person standing icon', keywords: ['body', 'human'] },

  // Art & Design
  { id: 'palette', name: 'Palette', icon: Palette, category: 'art', ariaLabel: 'Palette icon', keywords: ['colors', 'paint'] },
  { id: 'brush', name: 'Brush', icon: Brush, category: 'art', ariaLabel: 'Brush icon', keywords: ['paint', 'art'] },
  { id: 'paintbrush', name: 'Paintbrush', icon: Paintbrush, category: 'art', ariaLabel: 'Paintbrush icon', keywords: ['art', 'design'] },
  { id: 'scissors', name: 'Scissors', icon: Scissors, category: 'art', ariaLabel: 'Scissors icon', keywords: ['cut', 'craft'] },
  { id: 'shapes', name: 'Shapes', icon: Shapes, category: 'art', ariaLabel: 'Shapes icon', keywords: ['geometry', 'design'] },
  { id: 'circle', name: 'Circle', icon: Circle, category: 'art', ariaLabel: 'Circle icon', keywords: ['shape', 'round'] },
  { id: 'square', name: 'Square', icon: Square, category: 'art', ariaLabel: 'Square icon', keywords: ['shape', 'box'] },
  { id: 'triangle', name: 'Triangle', icon: Triangle, category: 'art', ariaLabel: 'Triangle icon', keywords: ['shape', 'warning'] },
  { id: 'hexagon', name: 'Hexagon', icon: Hexagon, category: 'art', ariaLabel: 'Hexagon icon', keywords: ['shape', 'polygon'] },

  // Games & Fun
  { id: 'gamepad', name: 'Gamepad', icon: Gamepad2, category: 'games', ariaLabel: 'Gamepad icon', keywords: ['gaming', 'controller'] },
  { id: 'dice', name: 'Dice', icon: Dice5, category: 'games', ariaLabel: 'Dice icon', keywords: ['game', 'random'] },
  { id: 'puzzle', name: 'Puzzle', icon: Puzzle, category: 'games', ariaLabel: 'Puzzle icon', keywords: ['game', 'solve'] },
  { id: 'trophy', name: 'Trophy', icon: Trophy, category: 'games', ariaLabel: 'Trophy icon', keywords: ['award', 'winner'] },
  { id: 'medal', name: 'Medal', icon: Medal, category: 'games', ariaLabel: 'Medal icon', keywords: ['award', 'achievement'] },
  { id: 'award', name: 'Award', icon: Award, category: 'games', ariaLabel: 'Award icon', keywords: ['prize', 'recognition'] },
  { id: 'gift', name: 'Gift', icon: Gift, category: 'games', ariaLabel: 'Gift icon', keywords: ['present', 'reward'] },
  { id: 'party-popper', name: 'Party', icon: PartyPopper, category: 'games', ariaLabel: 'Party popper icon', keywords: ['celebration', 'confetti'] },

  // Security & Privacy
  { id: 'lock', name: 'Lock', icon: Lock, category: 'security', ariaLabel: 'Lock icon', keywords: ['secure', 'private'] },
  { id: 'unlock', name: 'Unlock', icon: Unlock, category: 'security', ariaLabel: 'Unlock icon', keywords: ['open', 'access'] },
  { id: 'key', name: 'Key', icon: Key, category: 'security', ariaLabel: 'Key icon', keywords: ['access', 'password'] },
  { id: 'shield-check', name: 'Shield Check', icon: ShieldCheck, category: 'security', ariaLabel: 'Shield check icon', keywords: ['protected', 'verified'] },
  { id: 'fingerprint', name: 'Fingerprint', icon: Fingerprint, category: 'security', ariaLabel: 'Fingerprint icon', keywords: ['biometric', 'identity'] },
  { id: 'eye', name: 'Eye', icon: Eye, category: 'security', ariaLabel: 'Eye icon', keywords: ['view', 'visible'] },
  { id: 'eye-off', name: 'Eye Off', icon: EyeOff, category: 'security', ariaLabel: 'Eye off icon', keywords: ['hidden', 'invisible'] },

  // Miscellaneous
  { id: 'box', name: 'Box', icon: Box, category: 'misc', ariaLabel: 'Box icon', keywords: ['container', 'package'] },
  { id: 'package', name: 'Package', icon: Package, category: 'misc', ariaLabel: 'Package icon', keywords: ['box', 'delivery'] },
  { id: 'archive', name: 'Archive', icon: Archive, category: 'misc', ariaLabel: 'Archive icon', keywords: ['storage', 'old'] },
  { id: 'bookmark', name: 'Bookmark', icon: Bookmark, category: 'misc', ariaLabel: 'Bookmark icon', keywords: ['save', 'favorite'] },
  { id: 'tag', name: 'Tag', icon: Tag, category: 'misc', ariaLabel: 'Tag icon', keywords: ['label', 'category'] },
  { id: 'tags', name: 'Tags', icon: Tags, category: 'misc', ariaLabel: 'Tags icon', keywords: ['labels', 'categories'] },
  { id: 'hash', name: 'Hash', icon: Hash, category: 'misc', ariaLabel: 'Hash icon', keywords: ['hashtag', 'number'] },
  { id: 'link', name: 'Link', icon: Link, category: 'misc', ariaLabel: 'Link icon', keywords: ['url', 'connection'] },
  { id: 'anchor', name: 'Anchor', icon: Anchor, category: 'misc', ariaLabel: 'Anchor icon', keywords: ['marine', 'stable'] },
  { id: 'infinity', name: 'Infinity', icon: Infinity, category: 'misc', ariaLabel: 'Infinity icon', keywords: ['endless', 'forever'] },
  { id: 'zap', name: 'Zap', icon: Zap, category: 'misc', ariaLabel: 'Zap icon', keywords: ['lightning', 'fast'] },
  { id: 'flame', name: 'Flame', icon: Flame, category: 'misc', ariaLabel: 'Flame icon', keywords: ['fire', 'hot'] },
  { id: 'snowflake', name: 'Snowflake', icon: Snowflake, category: 'misc', ariaLabel: 'Snowflake icon', keywords: ['cold', 'winter'] },
  { id: 'umbrella', name: 'Umbrella', icon: Umbrella, category: 'misc', ariaLabel: 'Umbrella icon', keywords: ['rain', 'weather'] },
  { id: 'coffee', name: 'Coffee', icon: Coffee, category: 'misc', ariaLabel: 'Coffee icon', keywords: ['drink', 'cafe'] },
  { id: 'wine', name: 'Wine', icon: Wine, category: 'misc', ariaLabel: 'Wine icon', keywords: ['drink', 'celebration'] },
  { id: 'utensils', name: 'Utensils', icon: Utensils, category: 'misc', ariaLabel: 'Utensils icon', keywords: ['food', 'restaurant'] },
  { id: 'home', name: 'Home', icon: Home, category: 'misc', ariaLabel: 'Home icon', keywords: ['house', 'main'] },
  { id: 'store', name: 'Store', icon: Store, category: 'misc', ariaLabel: 'Store icon', keywords: ['shop', 'retail'] },
  { id: 'factory', name: 'Factory', icon: Factory, category: 'misc', ariaLabel: 'Factory icon', keywords: ['industrial', 'manufacturing'] },
  { id: 'warehouse', name: 'Warehouse', icon: Warehouse, category: 'misc', ariaLabel: 'Warehouse icon', keywords: ['storage', 'inventory'] },
];

/**
 * Default icon ID for Looms
 */
export const DEFAULT_LOOM_ICON = 'folder';

/**
 * Default icon ID for Weaves
 */
export const DEFAULT_WEAVE_ICON = 'sparkles';

/**
 * Get a preset icon by ID
 */
export function getPresetIcon(iconId: string | undefined | null): PresetIcon | undefined {
  if (!iconId) return undefined;
  return PRESET_ICONS.find((icon) => icon.id === iconId);
}

/**
 * Get the default Loom icon
 */
export function getDefaultLoomIcon(): PresetIcon {
  return PRESET_ICONS.find((icon) => icon.id === DEFAULT_LOOM_ICON)!;
}

/**
 * Get the default Weave icon
 */
export function getDefaultWeaveIcon(): PresetIcon {
  return PRESET_ICONS.find((icon) => icon.id === DEFAULT_WEAVE_ICON)!;
}

/**
 * Get icons by category
 */
export function getIconsByCategory(category: IconCategory): PresetIcon[] {
  return PRESET_ICONS.filter((icon) => icon.category === category);
}

/**
 * Search icons by keyword
 */
export function searchIcons(query: string): PresetIcon[] {
  const lowerQuery = query.toLowerCase();
  return PRESET_ICONS.filter((icon) => {
    return (
      icon.name.toLowerCase().includes(lowerQuery) ||
      icon.id.toLowerCase().includes(lowerQuery) ||
      icon.ariaLabel.toLowerCase().includes(lowerQuery) ||
      icon.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Get recommended icons for a Loom use case
 */
export function getRecommendedIconsForUseCase(
  useCase: 'storytelling' | 'worldbuilding' | 'research' | 'notebook' | 'documentation' | 'education' | 'custom'
): PresetIcon[] {
  const categoryMap: Record<string, IconCategory[]> = {
    storytelling: ['storytelling', 'creative'],
    worldbuilding: ['worldbuilding', 'storytelling'],
    research: ['knowledge', 'data'],
    notebook: ['creative', 'organization'],
    documentation: ['technology', 'organization'],
    education: ['knowledge', 'organization'],
    custom: ['default', 'misc'],
  };
  
  const categories = categoryMap[useCase] || categoryMap.custom;
  return PRESET_ICONS.filter((icon) => categories.includes(icon.category));
}



