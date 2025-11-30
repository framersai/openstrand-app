'use client';

import { useState } from 'react';
import { 
  Check, 
  X, 
  Minus, 
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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

type FeatureValue = boolean | 'partial' | 'paid' | 'plugin' | 'roadmap' | string;

interface Competitor {
  name: string;
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
      { key: 'dailyNotes', label: 'Daily Notes', tooltip: 'Automatic daily journal entries' },
      { key: 'canvas', label: 'Canvas/Whiteboard', tooltip: 'Visual canvas for spatial organization' },
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
      { key: 'aiChat', label: 'AI Chat Assistant', tooltip: 'Chat with AI about your notes' },
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
      { key: 'versionHistory', label: 'Version History', tooltip: 'Track and restore previous versions' },
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
  {
    name: 'Platform & Ecosystem',
    features: [
      { key: 'mobile', label: 'Mobile Apps', tooltip: 'Native iOS and Android apps' },
      { key: 'webApp', label: 'Web App', tooltip: 'Access via web browser' },
      { key: 'plugins', label: 'Plugin Ecosystem', tooltip: 'Extensible via third-party plugins' },
      { key: 'api', label: 'Public API', tooltip: 'Developer API for integrations' },
      { key: 'webClipper', label: 'Web Clipper', tooltip: 'Save web pages to your notes' },
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
      dailyNotes: 'roadmap',
      canvas: 'roadmap',
      // AI & Intelligence
      aiSummary: true,
      aiTagging: true,
      semanticSearch: true,
      localAI: true,
      flashcards: true,
      quizzes: true,
      aiChat: 'paid',
      // Data & Privacy
      encryption: true,
      exportAll: true,
      noVendorLock: true,
      gdpr: true,
      auditLog: 'paid',
      versionHistory: true,
      // Collaboration
      realtime: 'paid',
      comments: 'paid',
      sharing: 'paid',
      permissions: 'paid',
      teams: 'paid',
      // Platform
      mobile: 'roadmap',
      webApp: true,
      plugins: 'roadmap',
      api: true,
      webClipper: 'roadmap',
    },
  },
  {
    name: 'Obsidian',
    tagline: 'A second brain',
    url: 'https://obsidian.md',
    pricing: 'Free / $50/yr',
    features: {
      offline: true,
      openSource: false,
      selfHosted: 'partial',
      localFirst: true,
      noAccount: true,
      markdown: true,
      bidirectional: true,
      graphView: true,
      hierarchy: true,
      tagging: true,
      templates: 'plugin',
      dailyNotes: 'plugin',
      canvas: true,
      aiSummary: 'plugin',
      aiTagging: 'plugin',
      semanticSearch: 'plugin',
      localAI: 'plugin',
      flashcards: 'plugin',
      quizzes: 'plugin',
      aiChat: 'plugin',
      encryption: 'paid',
      exportAll: true,
      noVendorLock: true,
      gdpr: true,
      auditLog: false,
      versionHistory: 'paid',
      realtime: false,
      comments: false,
      sharing: 'paid',
      permissions: false,
      teams: false,
      mobile: true,
      webApp: false,
      plugins: true,
      api: false,
      webClipper: 'plugin',
    },
  },
  {
    name: 'Notion',
    tagline: 'All-in-one workspace',
    url: 'https://notion.so',
    pricing: 'Free / $8/mo+',
    features: {
      offline: 'partial',
      openSource: false,
      selfHosted: false,
      localFirst: false,
      noAccount: false,
      markdown: 'partial',
      bidirectional: true,
      graphView: false,
      hierarchy: true,
      tagging: true,
      templates: true,
      dailyNotes: false,
      canvas: false,
      aiSummary: 'paid',
      aiTagging: false,
      semanticSearch: 'paid',
      localAI: false,
      flashcards: false,
      quizzes: false,
      aiChat: 'paid',
      encryption: false,
      exportAll: true,
      noVendorLock: 'partial',
      gdpr: true,
      auditLog: 'paid',
      versionHistory: 'paid',
      realtime: true,
      comments: true,
      sharing: true,
      permissions: true,
      teams: true,
      mobile: true,
      webApp: true,
      plugins: 'partial',
      api: true,
      webClipper: true,
    },
  },
  {
    name: 'Roam Research',
    tagline: 'Networked thought',
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
      hierarchy: 'partial',
      tagging: true,
      templates: true,
      dailyNotes: true,
      canvas: false,
      aiSummary: false,
      aiTagging: false,
      semanticSearch: false,
      localAI: false,
      flashcards: 'plugin',
      quizzes: false,
      aiChat: false,
      encryption: true,
      exportAll: true,
      noVendorLock: 'partial',
      gdpr: true,
      auditLog: false,
      versionHistory: true,
      realtime: true,
      comments: false,
      sharing: true,
      permissions: true,
      teams: true,
      mobile: true,
      webApp: true,
      plugins: true,
      api: true,
      webClipper: true,
    },
  },
  {
    name: 'Logseq',
    tagline: 'Privacy-first',
    url: 'https://logseq.com',
    pricing: 'Free / $5/mo',
    features: {
      offline: true,
      openSource: true,
      selfHosted: true,
      localFirst: true,
      noAccount: true,
      markdown: true,
      bidirectional: true,
      graphView: true,
      hierarchy: 'partial',
      tagging: true,
      templates: true,
      dailyNotes: true,
      canvas: true,
      aiSummary: 'plugin',
      aiTagging: 'plugin',
      semanticSearch: 'plugin',
      localAI: 'plugin',
      flashcards: true,
      quizzes: false,
      aiChat: 'plugin',
      encryption: 'paid',
      exportAll: true,
      noVendorLock: true,
      gdpr: true,
      auditLog: false,
      versionHistory: 'paid',
      realtime: false,
      comments: false,
      sharing: 'paid',
      permissions: false,
      teams: false,
      mobile: true,
      webApp: false,
      plugins: true,
      api: false,
      webClipper: 'plugin',
    },
  },
];

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check className="h-3 w-3 text-emerald-600" />
        </div>
      </div>
    );
  }
  
  if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
          <X className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    );
  }
  
  if (value === 'partial') {
    return (
      <div className="flex items-center justify-center">
        <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Minus className="h-3 w-3 text-amber-600" />
        </div>
      </div>
    );
  }
  
  if (value === 'paid') {
    return (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-600">
        Paid
      </Badge>
    );
  }
  
  if (value === 'plugin') {
    return (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-purple-500/30 text-purple-600">
        Plugin
      </Badge>
    );
  }

  if (value === 'roadmap') {
    return (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-600">
        Soon
      </Badge>
    );
  }
  
  return (
    <span className="text-xs text-muted-foreground">{value}</span>
  );
}

export function CompetitorComparison({ id, className }: ComparisonSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Core Philosophy']);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => 
      prev.includes(name) 
        ? prev.filter(c => c !== name)
        : [...prev, name]
    );
  };

  return (
    <TooltipProvider>
      <section id={id} className={cn('landing-section py-16', className)}>
        <div className="container mx-auto px-4">
          {/* Header - No badge */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3">
              How OpenStrand Compares
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              An honest comparison with popular alternatives. We've researched each tool's current features.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="min-w-[800px]">
              {/* Header row */}
              <div className="grid grid-cols-6 gap-1.5 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2 border-b border-border">
                <div className="col-span-1" />
                {COMPETITORS.map((competitor, index) => (
                  <div 
                    key={competitor.name}
                    className={cn(
                      'text-center p-2 rounded-lg',
                      index === 0 && 'bg-primary/10 border border-primary/30'
                    )}
                  >
                    <div className="font-semibold text-xs">{competitor.name}</div>
                    <div className={cn(
                      'text-[10px] font-medium mt-0.5',
                      index === 0 ? 'text-emerald-600' : 'text-muted-foreground'
                    )}>
                      {competitor.pricing}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature categories */}
              {FEATURE_CATEGORIES.map((category) => {
                const isExpanded = expandedCategories.includes(category.name);
                
                return (
                  <div key={category.name} className="mb-2">
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category.name)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({category.features.length})
                      </span>
                    </button>

                    {/* Features */}
                    {isExpanded && (
                      <div className="mt-1 space-y-0.5">
                        {category.features.map((feature) => (
                          <div 
                            key={feature.key}
                            className="grid grid-cols-6 gap-1.5 py-1.5 px-2 rounded hover:bg-muted/20 transition-colors"
                          >
                            <div className="col-span-1 flex items-center gap-1.5">
                              <span className="text-xs">{feature.label}</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground/60" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs text-xs">{feature.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            {COMPETITORS.map((competitor, index) => (
                              <div 
                                key={`${competitor.name}-${feature.key}`}
                                className={cn(
                                  'flex items-center justify-center',
                                  index === 0 && 'bg-primary/5 rounded'
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
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-emerald-600" />
              </div>
              <span className="text-muted-foreground">Included</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Minus className="h-2.5 w-2.5 text-amber-600" />
              </div>
              <span className="text-muted-foreground">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-500/30 text-blue-600">
                Paid
              </Badge>
              <span className="text-muted-foreground">Paid add-on</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-500/30 text-purple-600">
                Plugin
              </Badge>
              <span className="text-muted-foreground">Via plugin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-600">
                Soon
              </Badge>
              <span className="text-muted-foreground">On roadmap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                <X className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Not available</span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground text-center mt-4 max-w-xl mx-auto">
            Feature availability researched as of late 2024. Some features may require specific plans.{' '}
            <a href="https://github.com/framersai/openstrand/issues" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Report inaccuracies
            </a>
          </p>
        </div>
      </section>
    </TooltipProvider>
  );
}
