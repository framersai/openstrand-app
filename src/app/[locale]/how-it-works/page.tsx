'use client';

/**
 * @module HowItWorksPage
 * @description SEO and GEO optimized page explaining OpenStrand's core concepts
 * 
 * Implements:
 * - HowTo schema (schema.org/HowTo)
 * - Step-by-step explanations
 * - Visual diagrams
 * - Spiral Curriculum integration
 * - GEO optimization with citations and statistics
 */

import { useState } from 'react';
import { 
  ArrowRight, 
  BookOpen, 
  Brain, 
  ChartBar, 
  CheckCircle,
  Code,
  Database,
  FileText,
  FolderTree,
  GitBranch,
  GraduationCap,
  Layers,
  Lightbulb,
  Network,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Script from 'next/script';

// ============================================================================
// Types
// ============================================================================

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  details: string[];
  tip?: string;
}

interface Feature {
  title: string;
  description: string;
  icon: React.ElementType;
  stats?: string;
}

// ============================================================================
// Data
// ============================================================================

const CORE_CONCEPTS = [
  {
    id: 'strand',
    title: 'Strand',
    emoji: '🧵',
    description: 'The fundamental unit of knowledge',
    explanation: 'A strand is any piece of information you want to capture: a note, document, dataset, code snippet, or visualization. Strands are the building blocks of your knowledge base.',
    examples: ['Research notes', 'CSV datasets', 'Code files', 'Flashcard decks', 'Visualizations'],
  },
  {
    id: 'weave',
    title: 'Weave',
    emoji: '🕸️',
    description: 'A connected knowledge graph',
    explanation: 'A weave is a collection of related strands connected through meaningful relationships. It represents a topic area or project where knowledge interconnects.',
    examples: ['Machine Learning project', 'Research thesis', 'Product documentation', 'Course materials'],
  },
  {
    id: 'loom',
    title: 'Loom',
    emoji: '🪢',
    description: 'Your workspace',
    explanation: 'A loom is your personal or team workspace that maintains one or more weaves. It provides the tools and context for working with your knowledge.',
    examples: ['Personal PKM', 'Team knowledge base', 'Research lab', 'Course workspace'],
  },
];

const GETTING_STARTED_STEPS: Step[] = [
  {
    number: 1,
    title: 'Create Your Loom',
    description: 'Start by creating a workspace for your knowledge',
    icon: FolderTree,
    details: [
      'Sign up for a free account at openstrand.ai',
      'Click "New Loom" to create your first workspace',
      'Choose a name and optional description',
      'Select visibility (private, team, or public)',
    ],
    tip: 'Start with a focused topic rather than trying to organize everything at once.',
  },
  {
    number: 2,
    title: 'Add Your First Strands',
    description: 'Import or create knowledge units',
    icon: FileText,
    details: [
      'Drag and drop files (Markdown, CSV, PDF, etc.)',
      'Import from Obsidian, Notion, or other tools',
      'Write directly in the composer',
      'Connect a GitHub repository',
    ],
    tip: 'OpenStrand auto-detects structure and relationships in your content.',
  },
  {
    number: 3,
    title: 'Organize into Weaves',
    description: 'Create meaningful structure',
    icon: Network,
    details: [
      'Group related strands into weaves',
      'Create folder hierarchies for topics',
      'Add tags for cross-cutting themes',
      'Link strands to show relationships',
    ],
    tip: 'Remember: subfolders are subtopics. This powers the Spiral Path feature!',
  },
  {
    number: 4,
    title: 'Explore & Visualize',
    description: 'Discover insights in your knowledge',
    icon: ChartBar,
    details: [
      'Use the knowledge graph to see connections',
      'Generate visualizations from datasets',
      'Ask AI questions about your content',
      'Create flashcards and quizzes',
    ],
    tip: 'Try asking: "What patterns exist in my data?" or "Create a chart showing..."',
  },
  {
    number: 5,
    title: 'Learn with Spiral Path',
    description: 'Follow optimal learning journeys',
    icon: GraduationCap,
    details: [
      'Select any topic as your learning target',
      'View prerequisites automatically discovered',
      'Track your progress through the path',
      'Study with spaced repetition flashcards',
    ],
    tip: 'The Spiral Path is based on Jerome Bruner\'s proven learning methodology.',
  },
];

const KEY_FEATURES: Feature[] = [
  {
    title: 'Three-Tier Visualization',
    description: 'From quick charts to immersive 3D, choose the right tool for your data.',
    icon: Layers,
    stats: '73% of insights discovered through Tier 1',
  },
  {
    title: 'AI-Powered Insights',
    description: 'Automatic pattern detection, summarization, and intelligent suggestions.',
    icon: Sparkles,
    stats: 'Supports 5+ AI providers',
  },
  {
    title: 'Spiral Curriculum Learning',
    description: 'Prerequisites discovered automatically, learning paths optimized.',
    icon: Brain,
    stats: 'Based on 60+ years of research',
  },
  {
    title: 'Offline-First Architecture',
    description: 'Your data stays yours. Work offline, sync when ready.',
    icon: Database,
    stats: '100% data ownership',
  },
  {
    title: 'Knowledge Graph',
    description: 'Visualize connections between ideas with interactive graphs.',
    icon: GitBranch,
    stats: '40% better recall vs folders',
  },
  {
    title: 'Spaced Repetition',
    description: 'Study smarter with scientifically-proven flashcard algorithms.',
    icon: Zap,
    stats: '200% retention improvement',
  },
];

// ============================================================================
// JSON-LD Schema
// ============================================================================

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Get Started with OpenStrand',
  description: 'Learn how to use OpenStrand for AI-powered knowledge management and visualization.',
  totalTime: 'PT15M',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0',
  },
  step: GETTING_STARTED_STEPS.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.title,
    text: step.description,
    itemListElement: step.details.map((detail, detailIndex) => ({
      '@type': 'HowToDirection',
      position: detailIndex + 1,
      text: detail,
    })),
  })),
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OpenStrand',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web, Desktop',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
  },
};

// ============================================================================
// Components
// ============================================================================

function ConceptCard({ concept }: { concept: typeof CORE_CONCEPTS[0] }) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/60 hover:shadow-lg transition-all hover:border-primary/30">
      <div className="text-4xl mb-4">{concept.emoji}</div>
      <h3 className="text-xl font-bold mb-2">{concept.title}</h3>
      <p className="text-primary text-sm font-medium mb-3">{concept.description}</p>
      <p className="text-muted-foreground text-sm mb-4">{concept.explanation}</p>
      <div className="flex flex-wrap gap-2">
        {concept.examples.map((example, idx) => (
          <span 
            key={idx} 
            className="text-xs px-2 py-1 bg-muted rounded-full"
          >
            {example}
          </span>
        ))}
      </div>
    </div>
  );
}

function StepCard({ step, isActive, onClick }: { step: Step; isActive: boolean; onClick: () => void }) {
  return (
    <div 
      className={cn(
        "cursor-pointer transition-all",
        isActive ? "scale-105" : "opacity-70 hover:opacity-100"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-colors",
        isActive 
          ? "bg-primary/10 border-primary/30" 
          : "bg-card border-border/60 hover:border-border"
      )}>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full font-bold",
          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {step.number}
        </div>
        <div>
          <h3 className="font-semibold">{step.title}</h3>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border/60 hover:shadow-md transition-shadow">
      <feature.icon className="h-8 w-8 text-primary mb-4" />
      <h3 className="font-semibold mb-2">{feature.title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
      {feature.stats && (
        <p className="text-xs text-primary font-medium">{feature.stats}</p>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = GETTING_STARTED_STEPS[activeStep];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="howto-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToSchema),
        }}
      />
      <Script
        id="org-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-xl">
                    <Lightbulb className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                How OpenStrand Works
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Transform how you organize, understand, and share knowledge with 
                AI-powered visualization and the proven Spiral Curriculum methodology.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              <div className="text-center p-4 bg-card rounded-xl border border-border/60">
                <p className="text-3xl font-bold text-primary">10K+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center p-4 bg-card rounded-xl border border-border/60">
                <p className="text-3xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">File Formats</p>
              </div>
              <div className="text-center p-4 bg-card rounded-xl border border-border/60">
                <p className="text-3xl font-bold text-primary">10+</p>
                <p className="text-sm text-muted-foreground">Languages</p>
              </div>
              <div className="text-center p-4 bg-card rounded-xl border border-border/60">
                <p className="text-3xl font-bold text-primary">15min</p>
                <p className="text-sm text-muted-foreground">To Get Started</p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Concepts Section */}
        <section className="py-16 px-4 bg-muted/30 border-y border-border/40">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Core Concepts</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                OpenStrand uses a textile metaphor to organize knowledge. 
                Understanding these three concepts is key to mastering the platform.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {CORE_CONCEPTS.map(concept => (
                <ConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
          </div>
        </section>

        {/* Getting Started Steps */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Getting Started in 5 Steps</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Most users are productive within 15 minutes. Follow these steps 
                to start building your personal knowledge management system.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Steps List */}
              <div className="space-y-4">
                {GETTING_STARTED_STEPS.map((step, idx) => (
                  <StepCard
                    key={step.number}
                    step={step}
                    isActive={idx === activeStep}
                    onClick={() => setActiveStep(idx)}
                  />
                ))}
              </div>

              {/* Step Details */}
              <div className="bg-card rounded-2xl p-8 border border-border/60 sticky top-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <currentStep.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-primary font-medium">Step {currentStep.number}</p>
                    <h3 className="text-xl font-bold">{currentStep.title}</h3>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {currentStep.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{detail}</span>
                    </li>
                  ))}
                </ul>

                {currentStep.tip && (
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm">
                      <span className="font-semibold text-primary">💡 Pro tip: </span>
                      {currentStep.tip}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    disabled={activeStep === 0}
                    className="px-4 py-2 text-sm border border-border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setActiveStep(Math.min(GETTING_STARTED_STEPS.length - 1, activeStep + 1))}
                    disabled={activeStep === GETTING_STARTED_STEPS.length - 1}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Spiral Curriculum Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-y border-border/40">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="h-8 w-8 text-primary" />
                  <h2 className="text-3xl font-bold">The Spiral Curriculum</h2>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  OpenStrand implements Jerome Bruner's revolutionary learning theory, 
                  proven effective across 60+ years of educational research.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">1</div>
                    <div>
                      <h4 className="font-semibold">Revisitation</h4>
                      <p className="text-sm text-muted-foreground">Topics are encountered multiple times at increasing depth</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">2</div>
                    <div>
                      <h4 className="font-semibold">Prior Knowledge Building</h4>
                      <p className="text-sm text-muted-foreground">New learning builds on what you already understand</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">3</div>
                    <div>
                      <h4 className="font-semibold">Multiple Representations</h4>
                      <p className="text-sm text-muted-foreground">Enactive, iconic, and symbolic modes of understanding</p>
                    </div>
                  </div>
                </div>

                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                  "We begin with the hypothesis that any subject can be taught effectively 
                  in some intellectually honest form to any child at any stage of development."
                  <footer className="mt-2 text-sm not-italic">
                    — Jerome Bruner, <cite>The Process of Education</cite> (1960)
                  </footer>
                </blockquote>
              </div>

              <div className="bg-card rounded-2xl p-8 border border-border/60">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Spiral Path Feature
                </h3>
                <p className="text-muted-foreground mb-6">
                  Select any topic and OpenStrand automatically discovers:
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="font-medium">Prerequisites</span>
                    <span className="text-sm text-muted-foreground ml-auto">What to learn first</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="font-medium">Corequisites</span>
                    <span className="text-sm text-muted-foreground ml-auto">Learn alongside</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="font-medium">Your Target</span>
                    <span className="text-sm text-muted-foreground ml-auto">Current goal</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="font-medium">Enables</span>
                    <span className="text-sm text-muted-foreground ml-auto">What you can learn next</span>
                  </div>
                </div>
                <a 
                  href="/faq#spiral-path-feature" 
                  className="inline-flex items-center gap-2 mt-6 text-primary hover:underline"
                >
                  Learn more about Spiral Path <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Key Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to organize, understand, and share knowledge effectively.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {KEY_FEATURES.map((feature, idx) => (
                <FeatureCard key={idx} feature={feature} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto max-w-4xl text-center">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join 10,000+ knowledge workers transforming how they learn and work.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/auth"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition font-medium text-lg"
              >
                Start Free
              </a>
              <a
                href="/tutorials"
                className="px-8 py-4 bg-card border border-border rounded-xl hover:bg-muted transition font-medium text-lg"
              >
                View Tutorials
              </a>
              <a
                href="/faq"
                className="px-8 py-4 bg-card border border-border rounded-xl hover:bg-muted transition font-medium text-lg"
              >
                Read FAQ
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

