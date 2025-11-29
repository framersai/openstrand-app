'use client';

/**
 * Spiral Curriculum Section
 * Explains the Spiral Curriculum methodology on the landing page
 */

import { RefreshCw, TrendingUp, Network, GraduationCap, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRINCIPLES = [
  {
    title: 'Revisit & Reinforce',
    description: 'Return to core concepts multiple times, each visit building on previous understanding and strengthening neural pathways.',
    icon: RefreshCw,
  },
  {
    title: 'Progressive Complexity',
    description: 'Each revisit adds depth and nuance, moving from foundational understanding to advanced mastery.',
    icon: TrendingUp,
  },
  {
    title: 'Connected Learning',
    description: 'Link new knowledge to existing understanding, creating a rich, interconnected mental model.',
    icon: Network,
  },
];

const STATS = [
  { value: '40%', label: 'Better retention with spiral learning' },
  { value: '2.5x', label: 'Faster skill acquisition' },
  { value: '85%', label: 'Improved long-term recall' },
];

export function SpiralCurriculumSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <GraduationCap className="h-4 w-4" />
            Learning Science
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Powered by the Spiral Curriculum
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            OpenStrand implements Jerome Bruner&apos;s proven Spiral Curriculum methodology 
            to help you learn faster and retain knowledge longer.
          </p>
        </div>

        {/* Principles Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PRINCIPLES.map((principle, index) => (
            <div
              key={principle.title}
              className={cn(
                'relative p-6 rounded-2xl border bg-card',
                'hover:shadow-lg hover:border-primary/50 transition-all duration-300'
              )}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                <principle.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{principle.title}</h3>
              <p className="text-muted-foreground">{principle.description}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="max-w-3xl mx-auto mb-12">
          <blockquote className="relative p-8 rounded-2xl bg-card border">
            <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/20" />
            <p className="text-lg md:text-xl italic text-center mb-4 pt-4">
              &quot;A curriculum as it develops should revisit basic ideas repeatedly, 
              building upon them until the student has grasped the full formal apparatus 
              that goes with them.&quot;
            </p>
            <footer className="text-center">
              <cite className="not-italic">
                <span className="font-semibold">Jerome Bruner</span>
                <span className="text-muted-foreground"> — The Process of Education (1960)</span>
              </cite>
            </footer>
          </blockquote>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center p-4">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Visual Learning Path */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">See Your Learning Path</h3>
              <p className="text-muted-foreground">
                OpenStrand visualizes your knowledge as an interconnected graph, 
                showing how concepts relate and where to focus next.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all',
                    level <= 3
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {level}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpiralCurriculumSection;

