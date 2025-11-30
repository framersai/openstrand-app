'use client';

/**
 * Use Cases Section
 * Showcases different ways to use OpenStrand
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  FlaskConical,
  BookHeart,
  PenTool,
  FileSearch,
  ClipboardList,
  Briefcase,
  Users,
  ArrowRight,
  FolderTree,
  FileText,
  Tag,
  Network,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

interface UseCaseSectionProps {
  id?: string;
  className?: string;
}

const USE_CASES = [
  {
    id: 'academia',
    icon: GraduationCap,
    title: 'Academic Research',
    tagline: 'From literature review to thesis defense',
    description: 'Organize papers, annotate sources, connect ideas across disciplines, and generate citations. Perfect for students, professors, and researchers.',
    color: 'from-blue-500 to-indigo-500',
    features: [
      'Literature review organization',
      'Citation management',
      'Cross-reference linking',
      'Thesis chapter outlining',
      'Research question tracking',
    ],
    example: {
      fabric: 'PhD Research',
      weaves: ['Literature Review', 'Methodology', 'Data Analysis', 'Writing'],
      looms: ['Qualitative Methods', 'Statistical Analysis', 'Interview Transcripts'],
      strands: ['grounded-theory-basics.md', 'nvivo-coding-guide.md', 'participant-001.md'],
    },
    testimonial: {
      quote: 'OpenStrand transformed how I manage my dissertation research. The knowledge graph helped me discover connections I would have missed.',
      author: 'PhD Candidate, Sociology',
    },
  },
  {
    id: 'research',
    icon: FlaskConical,
    title: 'Scientific Research',
    tagline: 'Lab notebooks meet knowledge graphs',
    description: 'Document experiments, track hypotheses, link findings to literature, and maintain reproducible research workflows.',
    color: 'from-emerald-500 to-teal-500',
    features: [
      'Experiment documentation',
      'Hypothesis tracking',
      'Protocol versioning',
      'Data lineage',
      'Reproducibility notes',
    ],
    example: {
      fabric: 'Lab Notebook',
      weaves: ['Projects', 'Protocols', 'Literature', 'Equipment'],
      looms: ['CRISPR Studies', 'Cell Culture', 'Imaging'],
      strands: ['experiment-2024-03-15.md', 'western-blot-protocol.md', 'results-analysis.md'],
    },
    testimonial: {
      quote: 'Finally, a tool that understands how scientists think. The bidirectional links between experiments and papers are invaluable.',
      author: 'Postdoc, Molecular Biology',
    },
  },
  {
    id: 'journaling',
    icon: BookHeart,
    title: 'Personal Journaling',
    tagline: 'Your thoughts, beautifully organized',
    description: 'Daily reflections, gratitude logs, dream journals, and personal growth tracking. Private by design, yours forever.',
    color: 'from-rose-500 to-pink-500',
    features: [
      'Daily entries with templates',
      'Mood & habit tracking',
      'Memory linking',
      'Annual reviews',
      'Private & encrypted',
    ],
    example: {
      fabric: 'Life Journal',
      weaves: ['Daily Logs', 'Reflections', 'Goals', 'Memories'],
      looms: ['2024', 'Gratitude', 'Dreams', 'Health'],
      strands: ['2024-03-15.md', 'morning-routine.md', 'bucket-list.md'],
    },
    testimonial: {
      quote: 'I\'ve tried every journaling app. OpenStrand is the first one where I actually own my data and can link entries together meaningfully.',
      author: 'Daily Journaler, 3 years',
    },
  },
  {
    id: 'writing',
    icon: PenTool,
    title: 'Creative Writing',
    tagline: 'World-building at scale',
    description: 'Novels, screenplays, worldbuilding, character sheets, and plot outlines. Link everything together for consistent storytelling.',
    color: 'from-purple-500 to-violet-500',
    features: [
      'Character databases',
      'Plot timeline tracking',
      'World-building wikis',
      'Scene organization',
      'Revision history',
    ],
    example: {
      fabric: 'Fantasy Novel',
      weaves: ['Characters', 'Locations', 'Plot', 'Magic System'],
      looms: ['Main Cast', 'Antagonists', 'Supporting'],
      strands: ['aria-backstory.md', 'chapter-01-draft.md', 'magic-rules.md'],
    },
    testimonial: {
      quote: 'The knowledge graph is perfect for tracking all my fantasy world details. No more inconsistencies!',
      author: 'Fantasy Author',
    },
  },
  {
    id: 'legal',
    icon: FileSearch,
    title: 'Legal Research',
    tagline: 'Case law meets knowledge management',
    description: 'Organize case files, track precedents, link statutes, and build arguments with interconnected legal research.',
    color: 'from-amber-500 to-orange-500',
    features: [
      'Case file organization',
      'Precedent linking',
      'Statute tracking',
      'Client matter management',
      'Argument building',
    ],
    example: {
      fabric: 'Legal Practice',
      weaves: ['Cases', 'Statutes', 'Precedents', 'Clients'],
      looms: ['Contract Law', 'Employment', 'IP'],
      strands: ['smith-v-jones-notes.md', 'employment-act-summary.md', 'client-brief.md'],
    },
    testimonial: {
      quote: 'OpenStrand helps me build stronger arguments by showing how cases connect. The offline mode is essential for court.',
      author: 'Associate Attorney',
    },
  },
  {
    id: 'project',
    icon: ClipboardList,
    title: 'Project Documentation',
    tagline: 'Technical docs that stay current',
    description: 'Software documentation, architecture decisions, meeting notes, and project wikis. Everything linked and searchable.',
    color: 'from-cyan-500 to-blue-500',
    features: [
      'Architecture Decision Records',
      'API documentation',
      'Meeting notes',
      'Runbooks & playbooks',
      'Onboarding guides',
    ],
    example: {
      fabric: 'Product Wiki',
      weaves: ['Architecture', 'APIs', 'Processes', 'Team'],
      looms: ['Backend', 'Frontend', 'Infrastructure'],
      strands: ['adr-001-database.md', 'api-auth.md', 'deploy-process.md'],
    },
    testimonial: {
      quote: 'We replaced Confluence with OpenStrand. The markdown-first approach means our docs live in git alongside our code.',
      author: 'Engineering Manager',
    },
  },
  {
    id: 'consulting',
    icon: Briefcase,
    title: 'Consulting & Advisory',
    tagline: 'Client knowledge, systematized',
    description: 'Client portfolios, industry research, frameworks, and deliverable templates. Build institutional knowledge.',
    color: 'from-slate-500 to-gray-600',
    features: [
      'Client knowledge bases',
      'Industry research',
      'Framework libraries',
      'Deliverable templates',
      'Engagement tracking',
    ],
    example: {
      fabric: 'Consulting Practice',
      weaves: ['Clients', 'Industries', 'Frameworks', 'Templates'],
      looms: ['Healthcare', 'Finance', 'Retail'],
      strands: ['client-acme-overview.md', 'digital-transformation-framework.md'],
    },
    testimonial: {
      quote: 'OpenStrand is our second brain. Every insight from every engagement is captured and linked.',
      author: 'Management Consultant',
    },
  },
  {
    id: 'team',
    icon: Users,
    title: 'Team Knowledge Base',
    tagline: 'Collective intelligence, organized',
    description: 'Shared wikis, onboarding docs, process guides, and institutional knowledge. Teams Edition enables real-time collaboration.',
    color: 'from-green-500 to-emerald-500',
    features: [
      'Shared workspaces',
      'Permission controls',
      'Real-time collaboration',
      'Comment threads',
      'Activity feeds',
    ],
    example: {
      fabric: 'Company Wiki',
      weaves: ['Engineering', 'Product', 'Design', 'Operations'],
      looms: ['Onboarding', 'Processes', 'Tools'],
      strands: ['new-hire-checklist.md', 'code-review-guide.md', 'design-system.md'],
    },
    testimonial: {
      quote: 'Finally replaced our scattered Google Docs with a proper knowledge base. Onboarding time cut in half.',
      author: 'Head of People',
    },
  },
];

function UseCaseCard({ 
  useCase, 
  isActive, 
  onClick 
}: { 
  useCase: typeof USE_CASES[0]; 
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = useCase.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all',
        isActive
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white',
          useCase.color
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{useCase.title}</div>
          <div className="text-xs text-muted-foreground truncate">{useCase.tagline}</div>
        </div>
        {isActive && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
      </div>
    </button>
  );
}

function HierarchyExample({ example }: { example: typeof USE_CASES[0]['example'] }) {
  return (
    <div className="rounded-xl border bg-card p-4 font-mono text-sm">
      <div className="flex items-center gap-2 text-primary font-semibold mb-2">
        <FolderTree className="h-4 w-4" />
        {example.fabric}/
      </div>
      <div className="ml-4 space-y-1">
        {example.weaves.map((weave, i) => (
          <div key={weave}>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span className="text-muted-foreground">├──</span>
              📁 {weave}/
            </div>
            {i === 0 && (
              <div className="ml-8 space-y-1">
                {example.looms.map((loom, j) => (
                  <div key={loom}>
                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                      <span className="text-muted-foreground">{j === example.looms.length - 1 ? '└──' : '├──'}</span>
                      📂 {loom}/
                    </div>
                    {j === 0 && (
                      <div className="ml-8 space-y-1">
                        {example.strands.slice(0, 2).map((strand, k) => (
                          <div key={strand} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <span className="text-muted-foreground">{k === 1 ? '└──' : '├──'}</span>
                            <FileText className="h-3 w-3" />
                            {strand}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function UseCasesSection({ id, className }: UseCaseSectionProps) {
  const [activeCase, setActiveCase] = useState(0);
  const localizePath = useLocalizedPath();
  const currentCase = USE_CASES[activeCase];

  return (
    <section id={id} className={cn('py-16 md:py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <Briefcase className="h-3 w-3" />
            Use Cases
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Built for How You Think
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re a researcher, writer, or team lead, OpenStrand adapts to your workflow.
            Here&apos;s how others are using it.
          </p>
        </div>

        {/* Use case selector + detail view */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Use case list */}
          <div className="space-y-2">
            {USE_CASES.map((useCase, index) => (
              <UseCaseCard
                key={useCase.id}
                useCase={useCase}
                isActive={activeCase === index}
                onClick={() => setActiveCase(index)}
              />
            ))}
          </div>

          {/* Right: Detail view */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0',
                currentCase.color
              )}>
                <currentCase.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{currentCase.title}</h3>
                <p className="text-muted-foreground">{currentCase.description}</p>
              </div>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Key Features
                </h4>
                <ul className="space-y-2">
                  {currentCase.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hierarchy example */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-primary" />
                  Example Structure
                </h4>
                <HierarchyExample example={currentCase.example} />
              </div>
            </div>

            {/* Testimonial */}
            <div className="rounded-xl bg-muted/50 p-6 border">
              <Quote className="h-6 w-6 text-primary/30 mb-2" />
              <p className="italic text-muted-foreground mb-3">
                &quot;{currentCase.testimonial.quote}&quot;
              </p>
              <p className="text-sm font-medium">— {currentCase.testimonial.author}</p>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link href={localizePath('/dashboard')}>
                  Try It Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href={localizePath('/tutorials')}>
                  View Tutorials
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UseCasesSection;

