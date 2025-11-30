'use client';

import { useState } from 'react';
import { 
  Check, 
  X, 
  Minus, 
  HelpCircle,
  ExternalLink,
  WifiOff,
  Cloud,
  Lock,
  Users,
  Code2,
  Sparkles,
  FileText,
  FolderTree,
  Network,
  Zap,
  DollarSign,
  Server,
  Smartphone,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ComparisonSectionProps {
  id?: string;
  className?: string;
}

type FeatureValue = boolean | 'partial' | 'paid' | 'plugin' | string;

interface Competitor {
  name: string;
  logo?: string;
  tagline: string;
  url: string;
  pricing: string;
  features: Record<string, FeatureValue>;
}

const FEATURE_CATEGORIES = [
  {
    name: 'Core Philosophy',
    features: [
      { key: 'offline', label: 'Works 100% Offline', tooltip: 'Full functionality without internet connection' },
      { key: 'openSource', label: 'Open Source', tooltip: 'Source code publicly available under permissive license' },
      { key: 'selfHosted', label: 'Self-Hosted Option', tooltip: 'Can be deployed on your own infrastructure' },
      { key: 'localFirst', label: 'Local-First Storage', tooltip: 'Data stored locally by default, not in cloud' },
      { key: 'noAccount', label: 'No Account Required', tooltip: 'Can use without creating an account' },
    ],
  },
  {
    name: 'Knowledge Management',
    features: [
      { key: 'markdown', label: 'Markdown Native', tooltip: 'Uses .md files as primary format' },
      { key: 'bidirectional', label: 'Bidirectional Links', tooltip: 'Automatic backlinks between notes' },
      { key: 'graphView', label: 'Knowledge Graph', tooltip: 'Visual graph of note connections' },
      { key: 'hierarchy', label: 'Folder Hierarchy', tooltip: 'Nested folder organization' },
      { key: 'tagging', label: 'Tag System', tooltip: 'Flexible tagging and categorization' },
      { key: 'templates', label: 'Templates', tooltip: 'Reusable note templates' },
    ],
  },
  {
    name: 'AI & Intelligence',
    features: [
      { key: 'aiSummary', label: 'AI Summarization', tooltip: 'Automatic content summarization' },
      { key: 'aiTagging', label: 'Auto-Tagging', tooltip: 'AI-powered automatic tagging' },
      { key: 'semanticSearch', label: 'Semantic Search', tooltip: 'Search by meaning, not just keywords' },
      { key: 'localAI', label: 'Local AI (No API)', tooltip: 'AI features work offline without API keys' },
      { key: 'flashcards', label: 'Flashcard Generation', tooltip: 'Auto-generate flashcards from notes' },
      { key: 'quizzes', label: 'Quiz Generation', tooltip: 'Auto-generate quizzes from content' },
    ],
  },
  {
    name: 'Data & Privacy',
    features: [
      { key: 'encryption', label: 'End-to-End Encryption', tooltip: 'Data encrypted before leaving device' },
      { key: 'exportAll', label: 'Full Data Export', tooltip: 'Export all data in open formats' },
      { key: 'noVendorLock', label: 'No Vendor Lock-in', tooltip: 'Easy to migrate to other tools' },
      { key: 'gdpr', label: 'GDPR Compliant', tooltip: 'Complies with EU data protection' },
      { key: 'auditLog', label: 'Audit Logging', tooltip: 'Track all changes and access' },
    ],
  },
  {
    name: 'Collaboration',
    features: [
      { key: 'realtime', label: 'Real-time Collaboration', tooltip: 'Multiple users editing simultaneously' },
      { key: 'comments', label: 'Comments & Discussions', tooltip: 'Comment threads on notes' },
      { key: 'sharing', label: 'Public Sharing', tooltip: 'Share notes publicly' },
      { key: 'permissions', label: 'Permission Controls', tooltip: 'Fine-grained access control' },
      { key: 'teams', label: 'Team Workspaces', tooltip: 'Dedicated team spaces' },
    ],
  },
];

const COMPETITORS: Competitor[] = [
  {
    name: 'OpenStrand',
    tagline: 'Knowledge Fabric',
    url: '/',
    pricing: 'Free Forever',
    features: {
      // Core Philosophy
      offline: true,
      openSource: true,
      selfHosted: true,
      localFirst: true,
      noAccount: true,
      // Knowledge Management
      markdown: true,
      bidirectional: true,
      graphView: true,
      hierarchy: true,
      tagging: true,
      templates: true,
      // AI & Intelligence
      aiSummary: true,
      aiTagging: true,
      semanticSearch: true,
      localAI: true, // Deterministic NLP, no API needed
      flashcards: true,
      quizzes: true,
      // Data & Privacy
      encryption: true,
      exportAll: true,
      noVendorLock: true,
      gdpr: true,
      auditLog: 'paid', // Teams edition
      // Collaboration
      realtime: 'paid', // Teams edition
      comments: 'paid',
      sharing: 'paid',
      permissions: 'paid',
      teams: 'paid',
    },
  },
  {
    name: 'Obsidian',
    tagline: 'A second brain',
    url: 'https://obsidian.md',
    pricing: 'Free / $50/yr Sync',
    features: {
      offline: true,
      openSource: false, // Core is closed source
      selfHosted: 'partial', // Can self-host files, not sync
      localFirst: true,
      noAccount: true,
      markdown: true,
      bidirectional: true,
      graphView: true,
      hierarchy: true,
      tagging: true,
      templates: 'plugin',
      aiSummary: 'plugin',
      aiTagging: 'plugin',
      semanticSearch: 'plugin',
      localAI: 'plugin',
      flashcards: 'plugin',
      quizzes: 'plugin',
      encryption: 'paid',
      exportAll: true,
      noVendorLock: true,
      gdpr: true,
      auditLog: false,
      realtime: false,
      comments: false,
      sharing: 'paid',
      permissions: false,
      teams: false,
    },
  },
  {
    name: 'Notion',
    tagline: 'All-in-one workspace',
    url: 'https://notion.so',
    pricing: 'Free / $8/mo+',
    features: {
      offline: 'partial', // Limited offline
      openSource: false,
      selfHosted: false,
      localFirst: false,
      noAccount: false,
      markdown: 'partial', // Import/export only
      bidirectional: true,
      graphView: false,
      hierarchy: true,
      tagging: true,
      templates: true,
      aiSummary: 'paid',
      aiTagging: false,
      semanticSearch: 'paid',
      localAI: false,
      flashcards: false,
      quizzes: false,
      encryption: false, // Not E2E
      exportAll: true,
      noVendorLock: 'partial',
      gdpr: true,
      auditLog: 'paid',
      realtime: true,
      comments: true,
      sharing: true,
      permissions: true,
      teams: true,
    },
  },
  {
    name: 'Roam Research',
    tagline: 'A note-taking tool for networked thought',
    url: 'https://roamresearch.com',
    pricing: '$15/mo',
    features: {
      offline: 'partial',
      openSource: false,
      selfHosted: false,
      localFirst: false,
      noAccount: false,
      markdown: true,
      bidirectional: true,
      graphView: true,
      hierarchy: 'partial', // Outline-based
      tagging: true,
      templates: true,
      aiSummary: false,
      aiTagging: false,
      semanticSearch: false,
      localAI: false,
      flashcards: 'plugin',
      quizzes: false,
      encryption: true,
      exportAll: true,
      noVendorLock: 'partial',
      gdpr: true,
      auditLog: false,
      realtime: true,
      comments: false,
      sharing: true,
      permissions: true,
      teams: true,
    },
  },
  {
    name: 'Logseq',
    tagline: 'Privacy-first knowledge base',
    url: 'https://logseq.com',
    pricing: 'Free / $5/mo Sync',
    features: {
      offline: true,
      openSource: true,
      selfHosted: true,
      localFirst: true,
      noAccount: true,
      markdown: true,
      bidirectional: true,
      graphView: true,
      hierarchy: 'partial', // Outline-based
      tagging: true,
      templates: true,
      aiSummary: 'plugin',
      aiTagging: 'plugin',
      semanticSearch: 'plugin',
      localAI: 'plugin',
      flashcards: true,
      quizzes: false,
      encryption: 'paid',
      exportAll: true,
      noVendorLock: true,
      gdpr: true,
      auditLog: false,
      realtime: false,
      comments: false,
      sharing: 'paid',
      permissions: false,
      teams: false,
    },
  },
];

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check className="h-4 w-4 text-emerald-600" />
        </div>
      </div>
    );
  }
  
  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
          <X className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  if (value === 'partial') {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Minus className="h-4 w-4 text-amber-600" />
        </div>
      </div>
    );
  }
  
  if (value === 'paid') {
    return (
      <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600">
        Paid
      </Badge>
    );
  }
  
  if (value === 'plugin') {
    return (
      <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
        Plugin
      </Badge>
    );
  }
  
  return (
    <span className="text-xs text-muted-foreground">{value}</span>
  );
}

export function CompetitorComparison({ id, className }: ComparisonSectionProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Core Philosophy');

  return (
    <TooltipProvider>
      <section id={id} className={cn('landing-section py-20', className)}>
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Fair Comparison
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              How OpenStrand Compares
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We believe in transparency. Here's an honest comparison with popular alternatives.
              We've researched each tool's current features as of 2024.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header row */}
              <div className="grid grid-cols-6 gap-2 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-3 border-b border-border">
                <div className="col-span-1" />
                {COMPETITORS.map((competitor, index) => (
                  <div 
                    key={competitor.name}
                    className={cn(
                      'text-center p-3 rounded-xl',
                      index === 0 && 'bg-primary/10 border-2 border-primary/30'
                    )}
                  >
                    <div className="font-semibold text-sm">{competitor.name}</div>
                    <div className="text-xs text-muted-foreground">{competitor.tagline}</div>
                    <div className={cn(
                      'text-xs font-medium mt-1',
                      index === 0 ? 'text-emerald-600' : 'text-muted-foreground'
                    )}>
                      {competitor.pricing}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature categories */}
              {FEATURE_CATEGORIES.map((category) => (
                <div key={category.name} className="mb-4">
                  {/* Category header */}
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.name ? null : category.name
                    )}
                    className="w-full flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors mb-2"
                  >
                    <span className="font-semibold text-sm">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({category.features.length} features)
                    </span>
                  </button>

                  {/* Features */}
                  {expandedCategory === category.name && (
                    <div className="space-y-1">
                      {category.features.map((feature) => (
                        <div 
                          key={feature.key}
                          className="grid grid-cols-6 gap-2 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="col-span-1 flex items-center gap-2">
                            <span className="text-sm">{feature.label}</span>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{feature.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          {COMPETITORS.map((competitor, index) => (
                            <div 
                              key={`${competitor.name}-${feature.key}`}
                              className={cn(
                                'flex items-center justify-center',
                                index === 0 && 'bg-primary/5 rounded-lg'
                              )}
                            >
                              <FeatureCell value={competitor.features[feature.key]} />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="h-3 w-3 text-emerald-600" />
              </div>
              <span className="text-muted-foreground">Included</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Minus className="h-3 w-3 text-amber-600" />
              </div>
              <span className="text-muted-foreground">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600">
                Paid
              </Badge>
              <span className="text-muted-foreground">Paid add-on</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600">
                Plugin
              </Badge>
              <span className="text-muted-foreground">Via plugin</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                <X className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Not available</span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
            Feature availability researched as of late 2024. Some features may require specific plans or configurations.
            We strive for accuracy—please{' '}
            <a href="https://github.com/framersai/openstrand/issues" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              let us know
            </a>{' '}
            if you spot any inaccuracies.
          </p>
        </div>
      </section>
    </TooltipProvider>
  );
}

