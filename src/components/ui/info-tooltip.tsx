'use client';

/**
 * @module InfoTooltip
 * @description Contextual help tooltips with Spiral Curriculum integration
 * 
 * Provides educational tooltips explaining OpenStrand concepts with:
 * - Short description
 * - Pro tips
 * - Spiral Curriculum context where relevant
 * - Links to documentation
 */

import { ReactNode, useState } from 'react';
import { HelpCircle, ExternalLink, Lightbulb, GraduationCap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TooltipData {
  /** Main title */
  title: string;
  /** Short description */
  text: string;
  /** Pro tip for advanced users */
  tip?: string;
  /** Spiral Curriculum context */
  spiral?: string;
  /** Link to learn more */
  learnMore?: string;
  /** Warning or important note */
  warning?: string;
}

export interface InfoTooltipProps {
  /** Tooltip content data */
  data: TooltipData;
  /** Size of the help icon */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as popover (click) instead of tooltip (hover) */
  asPopover?: boolean;
  /** Additional class names */
  className?: string;
  /** Children to wrap (if not using default icon) */
  children?: ReactNode;
}

// ============================================================================
// Tooltip Content Registry
// ============================================================================

export const STRAND_TOOLTIPS: Record<string, TooltipData> = {
  'strand-title': {
    title: 'Strand Title',
    text: 'A clear, descriptive title for this strand of knowledge.',
    tip: "Good titles are specific: 'Convolutional Neural Networks' not 'CNNs'. This helps with search and discovery.",
    learnMore: '/faq#what-is-loom-weave-strand',
  },
  'strand-summary': {
    title: 'Summary',
    text: 'A one-line description for quick scanning in lists and search results.',
    tip: 'Keep it under 160 characters. Think of it as a tweet about your strand.',
  },
  'strand-difficulty': {
    title: 'Difficulty Level',
    text: 'How challenging is this content? This affects where it appears in learning paths.',
    tip: 'Content should generally be harder than its prerequisites. This ensures proper scaffolding.',
    spiral: "In Bruner's Spiral Curriculum, learners encounter concepts at increasing difficulty levels. Setting the right difficulty ensures proper sequencing in the Spiral Path.",
    learnMore: '/faq#spiral-curriculum',
  },
  'strand-tags': {
    title: 'Tags',
    text: 'Cross-cutting labels for discovery and filtering. Tags are independent of folder hierarchy.',
    tip: 'Use tags for: difficulty level, media type, language, use case. Don\'t duplicate folder structure in tags—that\'s what hierarchy is for!',
    warning: 'Tags are flat and shared across your entire knowledge base. Use them for cross-cutting concerns.',
    learnMore: '/faq#what-is-loom-weave-strand',
  },
  'strand-prerequisites': {
    title: 'Prerequisites',
    text: 'What must learners understand before this content? Prerequisites define the learning path.',
    tip: 'OpenStrand uses prerequisites to generate Spiral Paths. Well-defined prerequisites = better learning journeys.',
    spiral: "Bruner emphasized building on prior knowledge. Prerequisites ensure proper scaffolding and prevent cognitive overload.",
    learnMore: '/faq#spiral-path-feature',
  },
  'strand-estimated-time': {
    title: 'Estimated Time',
    text: 'How long will it take to complete this content?',
    tip: 'Include time for reading, exercises, and reflection. This helps learners plan their study sessions.',
  },
  'strand-note-type': {
    title: 'Note Type',
    text: 'Categorize the purpose of this strand.',
    tip: 'Main notes are core content. Reference notes support main notes. Structure notes organize other notes. Index notes provide navigation.',
  },
  'strand-visibility': {
    title: 'Visibility',
    text: 'Who can see this strand?',
    tip: 'Private: only you. Team: your team members. Unlisted: anyone with link. Public: discoverable by anyone.',
  },
  'folder-hierarchy': {
    title: 'Topic Hierarchy',
    text: 'Subfolders are ALWAYS subtopics of their parent. Content becomes MORE SPECIFIC as you go deeper.',
    tip: 'This structure powers the Spiral Path learning system. Think: General → Specific.',
    spiral: 'The folder hierarchy represents topic specificity. OpenStrand uses this to build learning paths from general to specific concepts.',
    learnMore: '/faq#what-is-loom-weave-strand',
  },
  'weave-name': {
    title: 'Weave Name',
    text: 'A weave is a collection of related strands organized into a knowledge graph.',
    tip: 'Think of a weave as a project or topic area. Name it clearly: "Machine Learning Research" not "ML Stuff".',
    learnMore: '/faq#what-is-loom-weave-strand',
  },
  'loom-name': {
    title: 'Loom Name',
    text: 'A loom is your workspace that maintains one or more weaves.',
    tip: 'Looms provide context and tools for working with your knowledge. Most users have one personal loom.',
    learnMore: '/faq#what-is-loom-weave-strand',
  },
};

// ============================================================================
// Component
// ============================================================================

export function InfoTooltip({
  data,
  size = 'sm',
  asPopover = false,
  className,
  children,
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const trigger = children || (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      aria-label={`Help: ${data.title}`}
    >
      <HelpCircle className={iconSizes[size]} />
    </button>
  );

  const content = (
    <div className="space-y-3 max-w-xs">
      <div>
        <h4 className="font-semibold text-sm mb-1">{data.title}</h4>
        <p className="text-xs text-muted-foreground">{data.text}</p>
      </div>

      {data.tip && (
        <div className="flex gap-2 p-2 bg-primary/5 rounded-md">
          <Lightbulb className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{data.tip}</p>
        </div>
      )}

      {data.spiral && (
        <div className="flex gap-2 p-2 bg-secondary/10 rounded-md border border-secondary/20">
          <GraduationCap className="h-3.5 w-3.5 text-secondary-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-secondary-foreground mb-1">Spiral Curriculum</p>
            <p className="text-xs text-muted-foreground">{data.spiral}</p>
          </div>
        </div>
      )}

      {data.warning && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ {data.warning}
        </p>
      )}

      {data.learnMore && (
        <a
          href={data.learnMore}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );

  if (asPopover) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-80" side="right" align="start">
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="right" className="p-3">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Convenience component for field labels with integrated help
 */
export function LabelWithTooltip({
  label,
  tooltipKey,
  required = false,
  className,
}: {
  label: string;
  tooltipKey: keyof typeof STRAND_TOOLTIPS;
  required?: boolean;
  className?: string;
}) {
  const tooltipData = STRAND_TOOLTIPS[tooltipKey];

  return (
    <label className={cn("flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground", className)}>
      {label}
      {required && <span className="text-destructive">*</span>}
      {tooltipData && <InfoTooltip data={tooltipData} size="sm" />}
    </label>
  );
}

export default InfoTooltip;
