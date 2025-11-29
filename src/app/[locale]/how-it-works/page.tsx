'use client';

/**
 * How It Works Page - SEO/GEO Optimized
 * Explains the OpenStrand workflow and Spiral Curriculum methodology
 */

import { useState } from 'react';
import { 
  Upload, 
  Sparkles, 
  BarChart3, 
  Brain, 
  ArrowRight,
  FileText,
  Folder,
  Network,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 1,
    title: 'Upload Your Data',
    description: 'Import documents, datasets, or connect to external sources. OpenStrand supports Markdown, CSV, JSON, Excel, and more.',
    icon: Upload,
    details: [
      'Drag and drop files or paste content directly',
      'Connect to GitHub, Google Drive, or Notion',
      'Automatic format detection and parsing',
      'YAML frontmatter support for metadata',
    ],
  },
  {
    id: 2,
    title: 'AI Analysis',
    description: 'Our AI analyzes your content, extracts key concepts, and identifies relationships between pieces of information.',
    icon: Sparkles,
    details: [
      'Natural language processing for text content',
      'Statistical analysis for numerical data',
      'Automatic tagging and categorization',
      'Relationship and dependency detection',
    ],
  },
  {
    id: 3,
    title: 'Visualize Insights',
    description: 'Generate beautiful visualizations with natural language prompts. Ask questions about your data and get instant charts.',
    icon: BarChart3,
    details: [
      'Describe what you want to see in plain English',
      'AI selects the best visualization type',
      'Interactive charts with drill-down capabilities',
      'Export to PNG, SVG, or embed in documents',
    ],
  },
  {
    id: 4,
    title: 'Build Knowledge',
    description: 'Organize your insights into Strands, Looms, and Weaves. Create a personal knowledge graph that grows with you.',
    icon: Brain,
    details: [
      'Connect related concepts across documents',
      'Create hierarchical topic structures',
      'Tag and categorize for easy retrieval',
      'Build prerequisite chains for learning paths',
    ],
  },
];

const CONCEPTS = [
  {
    title: 'Strands',
    description: 'Individual pieces of knowledge - documents, notes, datasets, or insights.',
    icon: FileText,
  },
  {
    title: 'Looms',
    description: 'Workspaces that group related Strands into projects or topics.',
    icon: Folder,
  },
  {
    title: 'Weaves',
    description: 'Collections of Looms that share common themes or purposes.',
    icon: Network,
  },
];

const SPIRAL_PRINCIPLES = [
  {
    title: 'Revisit Concepts',
    description: 'Return to topics multiple times, each time building on previous understanding.',
    icon: RefreshCw,
  },
  {
    title: 'Increase Complexity',
    description: 'Each revisit adds depth and nuance, moving from simple to complex.',
    icon: TrendingUp,
  },
  {
    title: 'Build Connections',
    description: 'Link new knowledge to existing understanding, creating a rich mental model.',
    icon: Network,
  },
];

function StepCard({ step, isActive, onClick }: { step: typeof STEPS[0]; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-6 rounded-xl border transition-all duration-300',
        isActive
          ? 'bg-primary/5 border-primary shadow-lg'
          : 'bg-card border-border hover:border-primary/50'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'p-3 rounded-lg',
          isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          <step.icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'text-sm font-medium',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              Step {step.id}
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
          <p className="text-muted-foreground text-sm">{step.description}</p>
        </div>
      </div>
    </button>
  );
}

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(1);
  const currentStep = STEPS.find(s => s.id === activeStep) || STEPS[0];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              How OpenStrand Works
            </h1>
            <p className="text-lg text-muted-foreground">
              Transform your data into actionable insights with AI-powered analysis and the proven Spiral Curriculum methodology.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Step List */}
            <div className="space-y-4">
              {STEPS.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  isActive={activeStep === step.id}
                  onClick={() => setActiveStep(step.id)}
                />
              ))}
            </div>

            {/* Step Details */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-card border rounded-xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-primary text-primary-foreground">
                    <currentStep.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Step {currentStep.id} of {STEPS.length}</p>
                    <h2 className="text-2xl font-bold">{currentStep.title}</h2>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6">{currentStep.description}</p>
                <ul className="space-y-3">
                  {currentStep.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
                {activeStep < STEPS.length && (
                  <button
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="mt-6 flex items-center gap-2 text-primary font-medium hover:underline"
                  >
                    Next: {STEPS[activeStep].title}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Concepts */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Core Concepts</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              OpenStrand organizes knowledge into three hierarchical levels, making it easy to structure and navigate your information.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {CONCEPTS.map((concept) => (
              <div key={concept.title} className="bg-card border rounded-xl p-6 text-center">
                <div className="inline-flex p-4 rounded-xl bg-primary/10 text-primary mb-4">
                  <concept.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{concept.title}</h3>
                <p className="text-muted-foreground text-sm">{concept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spiral Curriculum */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <GraduationCap className="h-4 w-4" />
                Learning Science
              </div>
              <h2 className="text-3xl font-bold mb-4">The Spiral Curriculum</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                OpenStrand implements Jerome Bruner&apos;s Spiral Curriculum methodology, a proven approach to deep, lasting learning.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {SPIRAL_PRINCIPLES.map((principle) => (
                <div key={principle.title} className="bg-card border rounded-xl p-6">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary w-fit mb-4">
                    <principle.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{principle.title}</h3>
                  <p className="text-muted-foreground text-sm">{principle.description}</p>
                </div>
              ))}
            </div>

            <blockquote className="border-l-4 border-primary pl-6 py-4 bg-muted/30 rounded-r-xl">
              <p className="text-lg italic mb-2">
                &quot;A curriculum as it develops should revisit basic ideas repeatedly, building upon them until the student has grasped the full formal apparatus that goes with them.&quot;
              </p>
              <footer className="text-muted-foreground">
                — Jerome Bruner, <cite>The Process of Education</cite> (1960)
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of knowledge workers who use OpenStrand to organize their thinking and accelerate their learning.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Try OpenStrand Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a
              href="/faq"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border bg-background font-medium hover:bg-muted transition-colors"
            >
              View FAQ
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

