'use client';

/**
 * @module SpiralCurriculumSection
 * @description Landing page section explaining the Spiral Curriculum methodology
 * 
 * Implements:
 * - Jerome Bruner's Spiral Curriculum explanation
 * - Visual representation of learning paths
 * - GEO optimization with citations
 * - Interactive demo of Spiral Path feature
 */

import { useState } from 'react';
import { 
  ArrowRight, 
  Brain, 
  CheckCircle, 
  ChevronRight, 
  GraduationCap, 
  Layers, 
  Target,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PathNode {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  depth: number;
}

// ============================================================================
// Data
// ============================================================================

const SAMPLE_PATH: PathNode[] = [
  { id: '1', title: 'Variables & Types', status: 'completed', depth: 0 },
  { id: '2', title: 'Control Flow', status: 'completed', depth: 0 },
  { id: '3', title: 'Functions', status: 'completed', depth: 1 },
  { id: '4', title: 'Recursion', status: 'current', depth: 2 },
  { id: '5', title: 'Dynamic Programming', status: 'upcoming', depth: 3 },
];

const PRINCIPLES = [
  {
    icon: Layers,
    title: 'Revisitation',
    description: 'Encounter concepts multiple times at increasing depth',
  },
  {
    icon: Target,
    title: 'Prior Knowledge',
    description: 'New learning builds on what you already understand',
  },
  {
    icon: Brain,
    title: 'Multiple Modes',
    description: 'Hands-on, visual, and abstract representations',
  },
];

// ============================================================================
// Components
// ============================================================================

function PathVisualization() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/60">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-5 w-5 text-primary" />
        <span className="font-semibold">Learning Path: Dynamic Programming</span>
      </div>

      <div className="space-y-3">
        {SAMPLE_PATH.map((node, idx) => (
          <div
            key={node.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
              node.status === 'completed' && "bg-green-500/10 border border-green-500/20",
              node.status === 'current' && "bg-primary/10 border border-primary/30 scale-105",
              node.status === 'upcoming' && "bg-muted/50 border border-border/40 opacity-60",
              hoveredNode === node.id && "scale-105 shadow-md"
            )}
            style={{ marginLeft: `${node.depth * 16}px` }}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              node.status === 'completed' && "bg-green-500 text-white",
              node.status === 'current' && "bg-primary text-primary-foreground",
              node.status === 'upcoming' && "bg-muted text-muted-foreground"
            )}>
              {node.status === 'completed' ? (
                <CheckCircle className="h-4 w-4" />
              ) : node.status === 'current' ? (
                <Zap className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">{idx + 1}</span>
              )}
            </div>
            <span className={cn(
              "font-medium",
              node.status === 'current' && "text-primary"
            )}>
              {node.title}
            </span>
            {node.status === 'current' && (
              <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                Current Focus
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-sm text-muted-foreground">
        <span>3 of 5 completed</span>
        <span className="text-primary font-medium">60% progress</span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SpiralCurriculumSection({ id }: { id?: string }) {
  return (
    <section 
      id={id} 
      className="py-20 px-4 relative overflow-hidden"
      aria-labelledby="spiral-curriculum-heading"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h2 
            id="spiral-curriculum-heading"
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Learn the Way Your Brain Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            OpenStrand implements Jerome Bruner's revolutionary 
            <strong className="text-foreground"> Spiral Curriculum</strong>—the 
            same approach used by the world's best educators for over 60 years.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left: Explanation */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              What is Spiral Learning?
            </h3>
            <p className="text-muted-foreground mb-6">
              Instead of learning topics once and forgetting them, the Spiral Curriculum 
              ensures deep understanding through structured revisitation:
            </p>

            <div className="space-y-4 mb-8">
              {PRINCIPLES.map((principle, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-card/50 rounded-xl border border-border/60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <principle.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{principle.title}</h4>
                    <p className="text-sm text-muted-foreground">{principle.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Citation */}
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground text-sm">
              "We begin with the hypothesis that any subject can be taught effectively 
              in some intellectually honest form to any child at any stage of development."
              <footer className="mt-2 not-italic font-medium text-foreground">
                — Jerome Bruner, <cite>The Process of Education</cite> (1960)
              </footer>
            </blockquote>
          </div>

          {/* Right: Interactive Demo */}
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              Spiral Path Feature
            </h3>
            <p className="text-muted-foreground mb-6">
              Select any topic and OpenStrand automatically discovers your optimal 
              learning path, showing prerequisites and what each concept enables:
            </p>
            <PathVisualization />
          </div>
        </div>

        {/* How OpenStrand Implements This */}
        <div className="bg-card rounded-3xl p-8 border border-border/60 shadow-xl">
          <h3 className="text-xl font-bold mb-6 text-center">
            How OpenStrand Makes This Easy
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <span className="text-xl font-bold text-primary">📁</span>
              </div>
              <h4 className="font-semibold mb-2">Hierarchical Topics</h4>
              <p className="text-sm text-muted-foreground">
                Your folder structure IS your curriculum. Subfolders are subtopics—naturally more specific.
              </p>
            </div>
            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <span className="text-xl font-bold text-primary">🔗</span>
              </div>
              <h4 className="font-semibold mb-2">Prerequisite Discovery</h4>
              <p className="text-sm text-muted-foreground">
                Click any topic to see what you need to learn first, and what it enables you to learn next.
              </p>
            </div>
            <div className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <span className="text-xl font-bold text-primary">📊</span>
              </div>
              <h4 className="font-semibold mb-2">Visual Learning Paths</h4>
              <p className="text-sm text-muted-foreground">
                See your entire journey as an interactive graph or outline with progress tracking.
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <a
              href="/how-it-works#spiral-curriculum"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition font-medium"
            >
              Learn More About Spiral Learning
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="text-center p-4">
            <p className="text-3xl font-bold text-primary">60+</p>
            <p className="text-sm text-muted-foreground">Years of Research</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl font-bold text-primary">200%</p>
            <p className="text-sm text-muted-foreground">Retention Improvement</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl font-bold text-primary">40%</p>
            <p className="text-sm text-muted-foreground">Better Recall</p>
          </div>
          <div className="text-center p-4">
            <p className="text-3xl font-bold text-primary">Auto</p>
            <p className="text-sm text-muted-foreground">Prerequisite Detection</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpiralCurriculumSection;

