'use client';

/**
 * Spiral Curriculum Section
 * Explains the Spiral Curriculum methodology and OpenStrand's learning features
 */

import { useState } from 'react';
import Link from 'next/link';
import { 
  RefreshCw, 
  TrendingUp, 
  Network, 
  GraduationCap, 
  Quote,
  BookOpen,
  Brain,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  BarChart3,
  Layers,
  Play,
  Code2,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

const PRINCIPLES = [
  {
    title: 'Revisit & Reinforce',
    description: 'Return to core concepts multiple times, each visit building on previous understanding and strengthening neural pathways.',
    icon: RefreshCw,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Progressive Complexity',
    description: 'Each revisit adds depth and nuance, moving from foundational understanding to advanced mastery.',
    icon: TrendingUp,
    color: 'from-cyan-500 to-teal-500',
  },
  {
    title: 'Connected Learning',
    description: 'Link new knowledge to existing understanding, creating a rich, interconnected mental model.',
    icon: Network,
    color: 'from-teal-500 to-emerald-500',
  },
];

const STATS = [
  { value: '40%', label: 'Better retention with spiral learning', source: 'Harden & Stamper, 1999' },
  { value: '2.5x', label: 'Faster skill acquisition', source: 'Cognitive Load Theory' },
  { value: '85%', label: 'Improved long-term recall', source: 'Spaced Repetition Research' },
];

// Example flashcard preview
const EXAMPLE_FLASHCARD = {
  front: 'What is the Fabric in OpenStrand\'s hierarchy?',
  back: 'The Fabric is your entire knowledge base - the top-level container that holds all your Weaves, Looms, and Strands.',
  tags: ['openstrand', 'hierarchy', 'basics'],
  difficulty: 'easy',
};

// Example quiz question
const EXAMPLE_QUIZ = {
  question: 'Which level of OpenStrand\'s hierarchy represents individual markdown notes?',
  options: ['Fabric', 'Weave', 'Loom', 'Strand'],
  correct: 3,
  explanation: 'Strands are individual .md files - the atomic units of knowledge in your Fabric.',
};

// Curriculum integration example
const CURRICULUM_EXAMPLE = {
  topic: 'Machine Learning Fundamentals',
  levels: [
    { level: 1, title: 'Introduction', concepts: ['What is ML?', 'Types of Learning', 'Basic Terminology'] },
    { level: 2, title: 'Core Algorithms', concepts: ['Linear Regression', 'Decision Trees', 'K-Nearest Neighbors'] },
    { level: 3, title: 'Deep Learning', concepts: ['Neural Networks', 'Backpropagation', 'CNNs & RNNs'] },
    { level: 4, title: 'Advanced Topics', concepts: ['Transformers', 'Reinforcement Learning', 'MLOps'] },
  ],
};

function FlashcardPreview() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className="relative h-48 cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <div className={cn(
        'absolute inset-0 rounded-xl border-2 transition-all duration-500 transform-style-3d backface-hidden',
        flipped ? 'rotate-y-180' : '',
        'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30'
      )}>
        {/* Front */}
        <div className={cn(
          'absolute inset-0 p-6 flex flex-col backface-hidden',
          flipped && 'invisible'
        )}>
          <Badge variant="outline" className="w-fit mb-3 text-xs">
            <Brain className="h-3 w-3 mr-1" />
            Flashcard
          </Badge>
          <p className="text-lg font-medium flex-1">{EXAMPLE_FLASHCARD.front}</p>
          <p className="text-xs text-muted-foreground">Click to flip</p>
        </div>
        
        {/* Back */}
        <div className={cn(
          'absolute inset-0 p-6 flex flex-col backface-hidden rotate-y-180 bg-card rounded-xl',
          !flipped && 'invisible'
        )}>
          <Badge className="w-fit mb-3 text-xs bg-emerald-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Answer
          </Badge>
          <p className="text-sm flex-1">{EXAMPLE_FLASHCARD.back}</p>
          <div className="flex gap-1 flex-wrap">
            {EXAMPLE_FLASHCARD.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizPreview() {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-xl border bg-card p-6">
      <Badge variant="outline" className="mb-3 text-xs">
        <GraduationCap className="h-3 w-3 mr-1" />
        Quiz Question
      </Badge>
      <p className="font-medium mb-4">{EXAMPLE_QUIZ.question}</p>
      <div className="space-y-2 mb-4">
        {EXAMPLE_QUIZ.options.map((option, index) => (
          <button
            key={option}
            onClick={() => {
              setSelected(index);
              setRevealed(true);
            }}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-all text-sm',
              selected === index
                ? revealed && index === EXAMPLE_QUIZ.correct
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : revealed && index !== EXAMPLE_QUIZ.correct
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            )}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
            {option}
            {revealed && index === EXAMPLE_QUIZ.correct && (
              <CheckCircle2 className="inline h-4 w-4 ml-2 text-emerald-500" />
            )}
          </button>
        ))}
      </div>
      {revealed && (
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <strong>Explanation:</strong> {EXAMPLE_QUIZ.explanation}
        </div>
      )}
    </div>
  );
}

function CurriculumPreview() {
  const [activeLevel, setActiveLevel] = useState(0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold">{CURRICULUM_EXAMPLE.topic}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Spiral curriculum automatically structures learning progression
        </p>
      </div>
      
      {/* Level tabs */}
      <div className="flex border-b">
        {CURRICULUM_EXAMPLE.levels.map((level, index) => (
          <button
            key={level.level}
            onClick={() => setActiveLevel(index)}
            className={cn(
              'flex-1 py-3 text-xs font-medium transition-all',
              activeLevel === index
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted/50'
            )}
          >
            Level {level.level}
          </button>
        ))}
      </div>
      
      {/* Level content */}
      <div className="p-4">
        <h4 className="font-medium mb-3">
          {CURRICULUM_EXAMPLE.levels[activeLevel].title}
        </h4>
        <ul className="space-y-2">
          {CURRICULUM_EXAMPLE.levels[activeLevel].concepts.map((concept, index) => (
            <li key={concept} className="flex items-center gap-2 text-sm">
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
                index < 2 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'
              )}>
                {index < 2 ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
              </div>
              <span className={index < 2 ? 'line-through text-muted-foreground' : ''}>
                {concept}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SpiralCurriculumSection() {
  const localizePath = useLocalizedPath();

  return (
    <section id="spiral-learning" className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <GraduationCap className="h-3 w-3" />
            Learning Science
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Powered by the Spiral Curriculum
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            OpenStrand implements Jerome Bruner&apos;s proven Spiral Curriculum methodology 
            to help you learn faster and retain knowledge longer.
          </p>
        </div>

        {/* Principles Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PRINCIPLES.map((principle, index) => (
            <div
              key={principle.title}
              className={cn(
                'relative p-6 rounded-2xl border bg-card',
                'hover:shadow-lg hover:border-primary/50 transition-all duration-300'
              )}
            >
              <div className={cn(
                'absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br',
                principle.color
              )}>
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

        {/* Learning Tools Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">AI-Powered Learning Tools</h3>
            <p className="text-muted-foreground">
              Generate flashcards and quizzes automatically from your notes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Flashcard Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Brain className="h-4 w-4 text-primary" />
                Spaced Repetition Flashcards
              </div>
              <FlashcardPreview />
              <p className="text-xs text-muted-foreground">
                AI extracts key concepts and generates flashcards. Review using spaced repetition for optimal retention.
              </p>
            </div>

            {/* Quiz Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-primary" />
                Auto-Generated Quizzes
              </div>
              <QuizPreview />
              <p className="text-xs text-muted-foreground">
                Test your understanding with AI-generated questions. Track progress and identify weak areas.
              </p>
            </div>

            {/* Curriculum Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Layers className="h-4 w-4 text-primary" />
                Structured Learning Paths
              </div>
              <CurriculumPreview />
              <p className="text-xs text-muted-foreground">
                Organize knowledge into progressive levels. Track mastery across topics.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing clarification */}
        <div className="rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10 p-6 mb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Community Edition</h4>
                  <p className="text-xs text-muted-foreground">Free & Open Source</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Full flashcard & quiz generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Bring your own API keys (OpenAI, Anthropic, etc.)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Works 100% offline with local models</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Unlimited flashcards & quizzes</span>
                </li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Teams Edition</h4>
                  <p className="text-xs text-muted-foreground">Cloud-Powered</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>No API keys needed - we handle it</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Share quizzes with team members</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Leaderboards & progress tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span>Premium AI models included</span>
                </li>
              </ul>
            </div>
          </div>
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
        <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-xl bg-card border">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-[10px] text-muted-foreground/60">{stat.source}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href={localizePath('/flashcards')}>
                <Brain className="h-4 w-4" />
                Try Flashcards
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href={localizePath('/tutorials/pen-and-paper-strand')}>
                <BookOpen className="h-4 w-4" />
                Learn the Methodology
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* CSS for 3D flip effect */}
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </section>
  );
}

export default SpiralCurriculumSection;
