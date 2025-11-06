'use client';

import { 
  FileText, 
  Network, 
  Brain, 
  Upload, 
  Search, 
  Calendar,
  BarChart,
  Shield,
  Repeat,
  Users,
  Globe,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    title: 'Universal Content Import',
    description: 'Import any type of content - markdown, PDFs, images, videos, datasets. Everything becomes a strand in your knowledge weave.',
    icon: Upload,
    category: 'core',
    gradient: 'from-blue-500/20 to-blue-600/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Knowledge Graph Visualization',
    description: 'See your knowledge as an interconnected web. Explore relationships, find patterns, and discover new connections.',
    icon: Network,
    category: 'core',
    gradient: 'from-purple-500/20 to-purple-600/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Smart Search & Discovery',
    description: 'Find anything instantly with full-text and semantic search. AI helps surface related content you might have forgotten.',
    icon: Search,
    category: 'core',
    gradient: 'from-green-500/20 to-green-600/20',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Spaced Repetition Learning',
    description: 'Built-in SuperMemo 2 algorithm schedules reviews based on your performance. Never forget important knowledge.',
    icon: Repeat,
    category: 'pro',
    gradient: 'from-amber-500/20 to-amber-600/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    title: 'AI-Enhanced Connections',
    description: 'Optional AI analyzes your content to suggest relationships, generate summaries, and enhance metadata.',
    icon: Brain,
    category: 'pro',
    gradient: 'from-pink-500/20 to-pink-600/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    title: 'Collaborative Knowledge',
    description: 'Share strands and weaves with your team. Control access with fine-grained permissions.',
    icon: Users,
    category: 'team',
    gradient: 'from-indigo-500/20 to-indigo-600/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    title: 'Analytics & Insights',
    description: 'Track your learning progress, identify knowledge gaps, and get personalized recommendations.',
    icon: BarChart,
    category: 'pro',
    gradient: 'from-cyan-500/20 to-cyan-600/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    title: 'Privacy First',
    description: 'Your data stays local by default. Enable sync only when you want. Full encryption for cloud storage.',
    icon: Shield,
    category: 'core',
    gradient: 'from-emerald-500/20 to-emerald-600/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Multi-Language Support',
    description: 'Create and manage knowledge in 10+ languages. Automatic translation for cross-language discovery.',
    icon: Globe,
    category: 'core',
    gradient: 'from-teal-500/20 to-teal-600/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
];

const categoryLabels = {
  core: { label: 'Core', color: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  pro: { label: 'Pro', color: 'bg-purple-100/80 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
  team: { label: 'Teams', color: 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
};

export function PKMSFeatures() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Manage Knowledge
          </h2>
          <p className="text-lg text-muted-foreground">
            From simple note-taking to complex knowledge graphs, OpenStrand adapts to your workflow
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            const category = categoryLabels[feature.category as keyof typeof categoryLabels];
            
            return (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/80 p-6 backdrop-blur transition-all hover:border-primary/30 hover:shadow-xl"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className={cn('h-full w-full bg-gradient-to-br', feature.gradient)} />
                </div>

                <div className="relative">
                  {/* Icon and category */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className={cn('rounded-xl bg-gradient-to-br p-3', feature.gradient)}>
                      <Icon className={cn('h-6 w-6', feature.iconColor)} />
                    </div>
                    <Badge variant="secondary" className={cn('text-[10px]', category.color)}>
                      {category.label}
                    </Badge>
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-8 text-center">
          <div className="mx-auto max-w-2xl">
            <Zap className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h3 className="mb-2 text-2xl font-semibold">Ready to Transform Your Knowledge?</h3>
            <p className="text-muted-foreground">
              Start with the free core features and upgrade when you need advanced capabilities
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
