'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderTree, Network, Layers, Brain, Upload, GitBranch, Sparkles, Zap } from 'lucide-react';

/**
 * Product Cards - Highlighting Key Features with Recursive Model Terminology
 */
export function ProductCards() {
  const cards = [
    {
      icon: FolderTree,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      title: 'Recursive Strands',
      subtitle: 'One Model, Infinite Possibilities',
      description: 'Everything is a Strand. No folders, no files—just atomic units of content that nest infinitely. A Strand can be a note, dataset, code file, or a container for other Strands.',
      features: [
        'Infinite nesting without limits',
        'Polymorphic content (notes, datasets, media, code)',
        'No artificial type boundaries',
        'Same interface for everything'
      ],
      badge: 'Core Primitive'
    },
    {
      icon: Network,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      title: 'Looms & Weaves',
      subtitle: 'Trees + Graphs + YAML Schema',
      description: 'Looms organize Strands in hierarchical trees. Weaves connect them as knowledge graphs. Define them with YAML frontmatter, customize with icons and styles, save locally then publish.',
      features: [
        'YAML/Markdown schema definitions',
        'Custom icons & visual styling',
        'Local-first save → publish workflow',
        'Force-directed graph visualization'
      ],
      badge: 'Local-First'
    },
    {
      icon: Layers,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      title: 'Fabrics',
      subtitle: 'Your Personal Codex',
      description: 'Group multiple Looms into Fabrics—meta-collections that span projects. Your entire knowledge base becomes a unified, queryable Fabric.',
      features: [
        'Cross-project queries',
        'Unified search across Looms',
        'Thematic collections',
        'Knowledge domains'
      ],
      badge: 'Coming Soon'
    },
    {
      icon: Brain,
      iconColor: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      title: 'AI Intelligence',
      subtitle: 'LLM + Graph + Crowd Wisdom',
      description: 'Hybrid recommendation engine combines collaborative filtering, content similarity, graph proximity, and quality scores (LLM + human ratings).',
      features: [
        'Personalized recommendations',
        'RAG-powered Q&A with citations',
        'Graph algorithms (PageRank, community detection)',
        'Learning path generation'
      ],
      badge: 'Production Ready'
    },
    {
      icon: Upload,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      title: 'Import Anything',
      subtitle: 'Folders → Looms with Schema Parsing',
      description: 'Drag & drop folders with YAML frontmatter. OpenStrand parses your schema files, renders icons and styling, and preserves your structure as Looms and Weaves.',
      features: [
        'Auto-parse YAML frontmatter',
        'Custom icon support (180+ presets)',
        'Style properties (colors, gradients, thumbnails)',
        'Obsidian vault import'
      ],
      badge: 'Zero Migration Friction'
    },
    {
      icon: GitBranch,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      title: 'Version Everything',
      subtitle: 'Full History Tracking',
      description: 'Every Strand has complete version history. Branch, merge, and time-travel through your knowledge base like Git for your brain.',
      features: [
        'Immutable version history',
        'Branching & merging',
        'Diff visualization',
        'Rollback to any point'
      ],
      badge: 'Git for Knowledge'
    },
    {
      icon: Sparkles,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      title: 'Gamification',
      subtitle: 'Learn Through Play',
      description: 'Earn badges, climb leaderboards, and track streaks. Flashcards with spaced repetition. Adaptive quizzes with Leitner system. Pomodoro integration.',
      features: [
        'Badge achievements',
        'Team leaderboards (opt-in)',
        'Study session tracking',
        'Productivity analytics'
      ],
      badge: 'v1.4 Release'
    },
    {
      icon: Zap,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
      title: 'Voice Services',
      subtitle: 'TTS & STT Built-In',
      description: 'Text-to-speech narration for flashcards and notes. Speech-to-text for quick capture. Multiple providers supported (OpenAI, ElevenLabs, browser native).',
      features: [
        'Auto-narrate flashcards',
        'Voice note capture',
        'Multi-language support',
        'Quota management'
      ],
      badge: 'v1.6 Release'
    }
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Powerful Features Built on a Simple Model
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            One primitive (Strand). Two views (tree + graph). Infinite applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.title} className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`absolute top-0 left-0 w-full h-1 ${card.bgColor}`} />
              
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {card.badge}
                  </Badge>
                </div>
                
                <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                <CardDescription className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {card.subtitle}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {card.description}
                </p>
                
                <ul className="space-y-2">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Ready to transform your knowledge management?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/register" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Start Building Your Codex
              <Sparkles className="w-4 h-4" />
            </a>
            <a 
              href="/docs/TERMINOLOGY.md" 
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Read the Docs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}















